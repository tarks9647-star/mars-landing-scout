import { useEffect, useState } from "react";
import type { SiteAnalysis } from "@/lib/recon-analysis";

export interface TelemetryPoint {
  tick: number;
  time: string;
  temp: number;
  wind: number;
  pressure: number;
}

const WINDOW = 36;
const SOL_MINUTES = 1477; // 24h 37m
const STEP_MINUTES = 20;
const START_MINUTES = 6 * 60;

function sample(tick: number, a: SiteAnalysis, roughness: number): TelemetryPoint {
  const minutes = (START_MINUTES + tick * STEP_MINUTES) % SOL_MINUTES;
  const frac = minutes / SOL_MINUTES;
  const { meanC, amplitudeC } = a.temperature;
  const temp = meanC + (amplitudeC / 2) * Math.sin(2 * Math.PI * (frac - 0.375)) + (Math.random() - 0.5) * 3;
  const wind = Math.max(0, 4 + roughness * 8 + Math.sin(tick / 3) * 2 + (Math.random() - 0.5) * 2.5);
  const pressure = 610 * Math.exp(-a.elevationKm / 11.1) + (Math.random() - 0.5) * 6;
  const hh = Math.floor(minutes / 60) % 24;
  const mm = Math.floor(minutes % 60);
  return {
    tick,
    time: `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`,
    temp: Math.round(temp * 10) / 10,
    wind: Math.round(wind * 10) / 10,
    pressure: Math.round(pressure),
  };
}

/** Simulated live sensor stream seeded from the selected site's analysis. Client-only. */
export function useTelemetryStream(key: string | null, analysis: SiteAnalysis | null, roughness: number) {
  const [series, setSeries] = useState<TelemetryPoint[]>([]);

  useEffect(() => {
    if (!analysis || !key) {
      setSeries([]);
      return;
    }
    let tick = 24;
    setSeries(Array.from({ length: 24 }, (_, i) => sample(i, analysis, roughness)));
    const id = window.setInterval(() => {
      const point = sample(tick++, analysis, roughness);
      setSeries((prev) => [...prev.slice(-(WINDOW - 1)), point]);
    }, 1200);
    return () => window.clearInterval(id);
    // Re-seed only when the target changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return series;
}
