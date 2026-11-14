/**
 * Pure landing-site analysis model. Everything here is deterministic and
 * derived from image pixel statistics + site context, so it can be unit tested.
 */

export type MapKind = "geology" | "traverse" | "elevation";

export interface PixelStats {
  /** Mean luminance in the sample window, 0..1 */
  luminance: number;
  /** Luminance at the exact target point (3x3 average), 0..1 */
  pointLuminance: number;
  /** Normalised luminance spread (texture), 0..1 */
  roughness: number;
  /** Normalised mean neighbour gradient (edges, crater rims, boulders), 0..1 */
  edge: number;
  r: number;
  g: number;
  b: number;
  /** Saturation of the mean colour, 0..1 */
  saturation: number;
}

export interface SiteContext {
  kind: MapKind;
  latitude: number;
  elevationKm: number;
}

export interface Composition {
  basalt: number;
  ironOxide: number;
  sulfates: number;
  clays: number;
  dust: number;
}

export interface RiskBreakdown {
  terrain: number;
  slope: number;
  hazard: number;
  altitude: number;
  thermal: number;
  dust: number;
}

export type Verdict = "go" | "caution" | "nogo";

export interface SiteAnalysis {
  safetyScore: number;
  riskPercent: number;
  verdict: Verdict;
  slopeDeg: number;
  elevationKm: number;
  risks: RiskBreakdown;
  composition: Composition;
  ice: { index: number; distanceKm: number; depthM: number };
  temperature: { meanC: number; minC: number; maxC: number; amplitudeC: number };
}

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const lum = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** Reads RGBA pixel data in a circular window and returns texture/colour statistics. */
export function computeRegionStats(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  cx: number,
  cy: number,
  radius: number,
): PixelStats {
  const x0 = Math.max(0, Math.floor(cx - radius));
  const x1 = Math.min(width - 1, Math.ceil(cx + radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const y1 = Math.min(height - 1, Math.ceil(cy + radius));
  const r2 = radius * radius;

  const L = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    return lum((data[i] ?? 0) / 255, (data[i + 1] ?? 0) / 255, (data[i + 2] ?? 0) / 255);
  };

  let n = 0;
  let sumL = 0;
  let sumL2 = 0;
  let sr = 0;
  let sg = 0;
  let sb = 0;
  let grad = 0;
  let gn = 0;

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy > r2) continue;
      const i = (y * width + x) * 4;
      const r = (data[i] ?? 0) / 255;
      const g = (data[i + 1] ?? 0) / 255;
      const b = (data[i + 2] ?? 0) / 255;
      const l = lum(r, g, b);
      n++;
      sumL += l;
      sumL2 += l * l;
      sr += r;
      sg += g;
      sb += b;
      if (x + 1 < width && y + 1 < height) {
        grad += Math.abs(l - L(x + 1, y)) + Math.abs(l - L(x, y + 1));
        gn++;
      }
    }
  }

  if (n === 0) {
    return {
      luminance: 0,
      pointLuminance: 0,
      roughness: 0,
      edge: 0,
      r: 0,
      g: 0,
      b: 0,
      saturation: 0,
    };
  }

  const mean = sumL / n;
  const std = Math.sqrt(Math.max(0, sumL2 / n - mean * mean));
  const r = sr / n;
  const g = sg / n;
  const b = sb / n;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);

  // 3x3 average at the exact point
  const px = Math.round(clamp(cx, 0, width - 1));
  const py = Math.round(clamp(cy, 0, height - 1));
  let pl = 0;
  let pn = 0;
  for (let y = Math.max(0, py - 1); y <= Math.min(height - 1, py + 1); y++) {
    for (let x = Math.max(0, px - 1); x <= Math.min(width - 1, px + 1); x++) {
      pl += L(x, y);
      pn++;
    }
  }

  return {
    luminance: mean,
    pointLuminance: pn ? pl / pn : mean,
    roughness: clamp(std * 3.2),
    edge: clamp(gn ? (grad / gn) * 6 : 0),
    r,
    g,
    b,
    saturation: mx > 0 ? (mx - mn) / mx : 0,
  };
}

/** Converts raw weights into integer percentages that always sum to exactly 100. */
export function toPercentages<K extends string>(weights: Record<K, number>): Record<K, number> {
  const keys = Object.keys(weights) as K[];
  const total = keys.reduce((s, k) => s + Math.max(0, weights[k]), 0) || 1;
  const raw = keys.map((k) => ({ k, v: (Math.max(0, weights[k]) / total) * 100 }));
  const floored = raw.map((x) => ({ ...x, f: Math.floor(x.v) }));
  let remaining = 100 - floored.reduce((s, x) => s + x.f, 0);
  floored
    .slice()
    .sort((a, b) => b.v - b.f - (a.v - a.f))
    .forEach((x) => {
      if (remaining > 0) {
        x.f += 1;
        remaining--;
      }
    });
  const out = {} as Record<K, number>;
  floored.forEach((x) => (out[x.k] = x.f));
  return out;
}

export function estimateComposition(stats: PixelStats): Composition {
  const { r, g, b, saturation, luminance: L, roughness } = stats;
  // How much colour information to trust (grayscale rasters fall back to albedo heuristics).
  const colorW = clamp(saturation * 3);
  const gray = 1 - colorW;
  return toPercentages({
    basalt: 0.05 + (1 - L) * 0.6 * gray + colorW * Math.max(0, (r + b) / 2 - g + 0.05) * 3,
    ironOxide: 0.05 + 0.15 * gray + colorW * Math.max(0, r - b) * 3,
    sulfates:
      0.04 + L * roughness * 0.5 * gray + colorW * Math.max(0, (r + g) / 2 - b - 0.05) * 2.5 * L,
    clays: 0.04 + 0.08 * gray + colorW * Math.max(0, g - r + 0.03) * 4,
    dust: 0.05 + L * 0.55 * gray * (1 - roughness) + colorW * (1 - saturation) * 0.15,
  });
}

export function estimateTemperature(
  latitude: number,
  elevationKm: number,
  luminance: number,
  dustPct: number,
) {
  const absLat = Math.min(90, Math.abs(latitude));
  const meanC =
    -30 - 90 * Math.pow(absLat / 90, 1.5) - 2.2 * Math.max(0, elevationKm) + (0.5 - luminance) * 14;
  const amplitudeC = 85 * (1 - absLat / 130) * (1 - (dustPct / 100) * 0.35);
  return {
    meanC: Math.round(meanC),
    minC: Math.round(meanC - amplitudeC / 2),
    maxC: Math.round(meanC + amplitudeC / 2),
    amplitudeC: round1(amplitudeC),
  };
}

export function estimateIce(latitude: number, elevationKm: number, clayPct: number) {
  const latF = smoothstep(25, 65, Math.abs(latitude));
  const elevF = clamp((2 - elevationKm) / 8);
  const index = Math.round(clamp(latF * 75 + elevF * 12 + clayPct * 0.4, 0, 100));
  const miss = 1 - index / 100;
  return {
    index,
    distanceKm: Math.round(3 + Math.pow(miss, 1.7) * 2600),
    depthM: round1(0.05 + miss * miss * 30),
  };
}

export function verdictFor(safetyScore: number): Verdict {
  if (safetyScore >= 70) return "go";
  if (safetyScore >= 45) return "caution";
  return "nogo";
}

export function analyzeSite(stats: PixelStats, ctx: SiteContext): SiteAnalysis {
  const composition = estimateComposition(stats);
  const temperature = estimateTemperature(
    ctx.latitude,
    ctx.elevationKm,
    stats.luminance,
    composition.dust,
  );
  const ice = estimateIce(ctx.latitude, ctx.elevationKm, composition.clays);

  const slopeDeg = round1(clamp(stats.edge * 55 + stats.roughness * 15, 0, 45));
  const pct = (v: number) => Math.round(clamp(v, 0, 100));

  const risks: RiskBreakdown = {
    terrain: pct(stats.roughness * 110),
    slope: pct((slopeDeg / 25) * 100),
    hazard: pct(stats.edge * 130),
    altitude: pct(ctx.elevationKm > -1 ? ((ctx.elevationKm + 1) / 7) * 100 : 0),
    thermal: pct(((-temperature.meanC - 45) / 50) * 100),
    dust: pct(composition.dust * 1.1),
  };

  const weighted =
    risks.terrain * 0.25 +
    risks.slope * 0.25 +
    risks.hazard * 0.15 +
    risks.altitude * 0.12 +
    risks.thermal * 0.12 +
    risks.dust * 0.11;

  const safetyScore = pct(100 - weighted + ice.index * 0.05);

  return {
    safetyScore,
    riskPercent: pct(weighted),
    verdict: verdictFor(safetyScore),
    slopeDeg,
    elevationKm: round1(ctx.elevationKm),
    risks,
    composition,
    ice,
    temperature,
  };
}
