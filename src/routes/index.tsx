import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GuideDialog } from "@/components/recon/GuideDialog";
import { MapInspector, type TargetMarker } from "@/components/recon/MapInspector";
import { ReconHeader } from "@/components/recon/ReconHeader";
import { TargetLog, type LogEntry } from "@/components/recon/TargetLog";
import { TelemetryDashboard } from "@/components/recon/TelemetryDashboard";
import { useImageSampler } from "@/hooks/use-image-sampler";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { getMap, inspect, type InspectionResult, type MapId } from "@/lib/mars-maps";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ARES·RECON — Mars Landing Site Reconnaissance" },
      {
        name: "description",
        content:
          "Inspect NASA Mars maps, drop landing targets anywhere and read live safety, risk, mineral, water-ice and temperature telemetry.",
      },
      { property: "og:title", content: "ARES·RECON — Mars Landing Site Reconnaissance" },
      {
        property: "og:description",
        content:
          "Click-to-target Mars landing reconnaissance with live telemetry charts, in English and Arabic.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReconPage,
});

interface Target {
  id: string;
  label: string;
  mapId: MapId;
  u: number;
  v: number;
  result: InspectionResult;
}

const MAX_TARGETS = 12;

function ReconPage() {
  return (
    <I18nProvider>
      <ReconConsole />
    </I18nProvider>
  );
}

function ReconConsole() {
  const { dir } = useI18n();
  const [guideOpen, setGuideOpen] = useState(false);
  const [mapId, setMapId] = useState<MapId>("geology");
  const [targets, setTargets] = useState<Target[]>([]);
  const [activeByMap, setActiveByMap] = useState<Partial<Record<MapId, string>>>({});
  const counter = useRef(0);
  const seeded = useRef(new Set<MapId>());

  const map = getMap(mapId);
  const pixels = useImageSampler(map.src);

  const createTarget = useCallback(
    (u: number, v: number) => {
      if (!pixels) return;
      counter.current += 1;
      const n = counter.current;
      const target: Target = {
        id: `tgt-${n}-${Date.now()}`,
        label: `TGT-${String(n).padStart(3, "0")}`,
        mapId: map.id,
        u,
        v,
        result: inspect(map, pixels, u, v),
      };
      setTargets((prev) => [target, ...prev].slice(0, MAX_TARGETS));
      setActiveByMap((prev) => ({ ...prev, [map.id]: target.id }));
    },
    [map, pixels],
  );

  const moveActive = useCallback(
    (u: number, v: number) => {
      const id = activeByMap[map.id];
      if (!pixels || !id) return;
      setTargets((prev) =>
        prev.map((tg) => (tg.id === id ? { ...tg, u, v, result: inspect(map, pixels, u, v) } : tg)),
      );
    },
    [activeByMap, map, pixels],
  );

  // Drop a default target the first time each map finishes calibrating.
  useEffect(() => {
    if (!pixels || activeByMap[map.id] || seeded.current.has(map.id)) return;
    seeded.current.add(map.id);
    createTarget(map.defaultTarget.u, map.defaultTarget.v);
  }, [pixels, map, activeByMap, createTarget]);

  const activeTarget = targets.find((tg) => tg.id === activeByMap[map.id]) ?? null;

  const markers = useMemo(() => {
    const onMap = targets.filter((tg) => tg.mapId === map.id);
    const toMarker = (tg: Target): TargetMarker => ({
      id: tg.id,
      label: tg.label,
      u: tg.u,
      v: tg.v,
    });
    return {
      active: activeTarget ? toMarker(activeTarget) : null,
      others: onMap.filter((tg) => tg.id !== activeTarget?.id).map(toMarker),
    };
  }, [targets, map.id, activeTarget]);

  const logEntries: LogEntry[] = targets.map((tg) => ({
    id: tg.id,
    label: tg.label,
    mapId: tg.mapId,
    safety: tg.result.analysis.safetyScore,
    verdict: tg.result.analysis.verdict,
  }));

  const iceComparison = targets
    .slice(0, 6)
    .reverse()
    .map((tg) => ({
      label: tg.label.replace("TGT-", "T"),
      value: tg.result.analysis.ice.index,
      active: tg.id === activeTarget?.id,
    }));

  const pickFromLog = (entry: LogEntry) => {
    setMapId(entry.mapId);
    setActiveByMap((prev) => ({ ...prev, [entry.mapId]: entry.id }));
  };

  return (
    <div dir={dir} className="min-h-screen">
      <ReconHeader onOpenGuide={() => setGuideOpen(true)} />
      <main className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4 lg:sticky lg:top-20 lg:self-start">
          <MapInspector
            map={map}
            onMapChange={setMapId}
            ready={!!pixels}
            active={markers.active}
            others={markers.others}
            onSelect={(u, v, mode) => (mode === "move" ? moveActive(u, v) : createTarget(u, v))}
          />
          <TargetLog
            entries={logEntries}
            activeId={activeTarget?.id ?? null}
            onPick={pickFromLog}
          />
        </div>
        <TelemetryDashboard
          targetId={activeTarget?.id ?? null}
          targetLabel={activeTarget?.label ?? null}
          result={activeTarget?.result ?? null}
          iceComparison={iceComparison}
        />
      </main>
      <GuideDialog open={guideOpen} onOpenChange={setGuideOpen} />
    </div>
  );
}
