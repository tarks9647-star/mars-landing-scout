import craterGeology from "@/assets/maps/mars-crater-geology.jpeg";
import roverTraverse from "@/assets/maps/mars-rover-traverse.jpeg";
import globalElevation from "@/assets/maps/mars-global-elevation.jpg";
import {
  analyzeSite,
  clamp,
  computeRegionStats,
  type MapKind,
  type PixelStats,
  type SiteAnalysis,
} from "@/lib/recon-analysis";

export type MapId = MapKind;

export type MapGeometry =
  | { type: "equirect" }
  | {
      type: "local";
      refLat: number;
      refLon: number;
      spanXKm: number;
      spanYKm: number;
      baseElevKm: number;
      reliefKm: number;
    };

export interface MarsMap {
  id: MapId;
  src: string;
  width: number;
  height: number;
  geometry: MapGeometry;
  /** Default target (normalised) dropped on first load */
  defaultTarget: { u: number; v: number };
}

/** Mars: ~59.3 km per degree of latitude */
const KM_PER_DEG = 59.27;

export const MARS_MAPS: MarsMap[] = [
  {
    id: "geology",
    src: craterGeology,
    width: 1080,
    height: 1096,
    geometry: {
      type: "local",
      refLat: -8.4,
      refLon: -61.2,
      spanXKm: 120,
      spanYKm: 122,
      baseElevKm: -1.6,
      reliefKm: 1.4,
    },
    defaultTarget: { u: 0.62, v: 0.5 },
  },
  {
    id: "traverse",
    src: roverTraverse,
    width: 685,
    height: 1101,
    geometry: {
      type: "local",
      refLat: -2.3,
      refLon: -5.2,
      spanXKm: 2.1,
      spanYKm: 3.4,
      baseElevKm: -1.9,
      reliefKm: 0.35,
    },
    defaultTarget: { u: 0.25, v: 0.42 },
  },
  {
    id: "elevation",
    src: globalElevation,
    width: 1024,
    height: 501,
    geometry: { type: "equirect" },
    defaultTarget: { u: 0.47, v: 0.52 },
  },
];

export const getMap = (id: MapId): MarsMap => MARS_MAPS.find((m) => m.id === id) ?? MARS_MAPS[0]!;

export interface ProjectedPoint {
  lat: number;
  lon: number;
  px: number;
  py: number;
  xKm?: number;
  yKm?: number;
}

export function projectPoint(map: MarsMap, u: number, v: number): ProjectedPoint {
  const cu = clamp(u);
  const cv = clamp(v);
  const px = Math.round(cu * (map.width - 1));
  const py = Math.round(cv * (map.height - 1));
  const g = map.geometry;
  if (g.type === "equirect") {
    return { lat: 90 - cv * 180, lon: cu * 360 - 180, px, py };
  }
  const xKm = (cu - 0.5) * g.spanXKm;
  const yKm = (0.5 - cv) * g.spanYKm;
  const lat = g.refLat + yKm / KM_PER_DEG;
  const lon = g.refLon + xKm / (KM_PER_DEG * Math.cos((lat * Math.PI) / 180));
  return { lat, lon, px, py, xKm, yKm };
}

/** Bright = high on the global relief raster (MOLA-like range ~ -8 km to +21 km). */
export function estimateElevation(map: MarsMap, pointLuminance: number): number {
  const g = map.geometry;
  if (g.type === "equirect") return -8 + 29 * Math.pow(clamp(pointLuminance), 2.2);
  return g.baseElevKm + (pointLuminance - 0.5) * 2 * g.reliefKm;
}

export interface PixelBuffer {
  src: string;
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface InspectionResult {
  point: ProjectedPoint;
  stats: PixelStats;
  analysis: SiteAnalysis;
}

export function inspect(map: MarsMap, pixels: PixelBuffer, u: number, v: number): InspectionResult {
  const point = projectPoint(map, u, v);
  const sx = clamp(u) * (pixels.width - 1);
  const sy = clamp(v) * (pixels.height - 1);
  const radius = Math.max(6, Math.round(pixels.width * 0.018));
  const stats = computeRegionStats(pixels.data, pixels.width, pixels.height, sx, sy, radius);
  const elevationKm = estimateElevation(map, stats.pointLuminance);
  const analysis = analyzeSite(stats, { kind: map.id, latitude: point.lat, elevationKm });
  return { point, stats, analysis };
}
