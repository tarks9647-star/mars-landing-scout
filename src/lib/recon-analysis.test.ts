import { describe, expect, it } from "vitest";
import {
  analyzeSite,
  computeRegionStats,
  estimateComposition,
  estimateIce,
  estimateTemperature,
  toPercentages,
  type PixelStats,
} from "@/lib/recon-analysis";

const gray = (over: Partial<PixelStats> = {}): PixelStats => ({
  luminance: 0.5,
  pointLuminance: 0.5,
  roughness: 0.05,
  edge: 0.03,
  r: 0.5,
  g: 0.5,
  b: 0.5,
  saturation: 0,
  ...over,
});

describe("landing site analysis", () => {
  it("rates a smooth, low, equatorial plain as GO with safety of at least 70", () => {
    const a = analyzeSite(gray(), { kind: "elevation", latitude: 5, elevationKm: -2 });
    expect(a.verdict).toBe("go");
    expect(a.safetyScore).toBeGreaterThanOrEqual(70);
  });

  it("rates rough, steep, high terrain as NO-GO (safety below 45)", () => {
    const a = analyzeSite(gray({ roughness: 0.7, edge: 0.6 }), {
      kind: "elevation",
      latitude: 5,
      elevationKm: 8,
    });
    expect(a.verdict).toBe("nogo");
    expect(a.safetyScore).toBeLessThan(45);
  });

  it("caps estimated slope at 45 degrees", () => {
    const a = analyzeSite(gray({ roughness: 1, edge: 1 }), {
      kind: "traverse",
      latitude: 0,
      elevationKm: 0,
    });
    expect(a.slopeDeg).toBe(45);
  });

  it("rock composition always sums to exactly 100%", () => {
    const samples = [
      gray(),
      gray({ r: 0.8, g: 0.5, b: 0.3, saturation: 0.6 }),
      gray({ luminance: 0.9, roughness: 0.4 }),
    ];
    for (const s of samples) {
      const c = estimateComposition(s);
      expect(Object.values(c).reduce((x, y) => x + y, 0)).toBe(100);
    }
    expect(Object.values(toPercentages({ a: 1, b: 1, c: 1 })).reduce((x, y) => x + y, 0)).toBe(100);
  });

  it("polar sites are colder and more ice-likely than equatorial ones", () => {
    const eq = estimateTemperature(0, 0, 0.5, 20);
    const pole = estimateTemperature(75, 0, 0.5, 20);
    expect(pole.meanC).toBeLessThan(eq.meanC);
    expect(estimateIce(75, -3, 10).index).toBeGreaterThan(estimateIce(0, -3, 10).index);
    expect(estimateIce(75, -3, 10).distanceKm).toBeLessThan(estimateIce(0, -3, 10).distanceKm);
  });

  it("a uniform raster has zero roughness and zero edges", () => {
    const w = 20;
    const h = 20;
    const data = new Uint8ClampedArray(w * h * 4).fill(128);
    const s = computeRegionStats(data, w, h, 10, 10, 5);
    expect(s.roughness).toBeCloseTo(0, 4);
    expect(s.edge).toBeCloseTo(0, 4);
    expect(s.luminance).toBeCloseTo(128 / 255, 3);
  });
});
