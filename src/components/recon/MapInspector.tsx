import {
  useCallback,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { Maximize2, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatLat, formatLon, useI18n, type TranslationKey } from "@/lib/i18n";
import { MARS_MAPS, projectPoint, type MapId, type MarsMap } from "@/lib/mars-maps";
import { clamp } from "@/lib/recon-analysis";

export interface TargetMarker {
  id: string;
  label: string;
  u: number;
  v: number;
}

interface MapInspectorProps {
  map: MarsMap;
  onMapChange: (id: MapId) => void;
  ready: boolean;
  active: TargetMarker | null;
  others: TargetMarker[];
  onSelect: (u: number, v: number, mode: "new" | "move") => void;
}

export function MapInspector({
  map,
  onMapChange,
  ready,
  active,
  others,
  onSelect,
}: MapInspectorProps) {
  const { t, lang } = useI18n();
  const [native, setNative] = useState(false);
  const [hover, setHover] = useState<{ u: number; v: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const toUV = useCallback((clientX: number, clientY: number) => {
    const el = imgRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      u: clamp((clientX - rect.left) / rect.width),
      v: clamp((clientY - rect.top) / rect.height),
    };
  }, []);

  const handleMove = (e: PointerEvent<HTMLDivElement>) => setHover(toUV(e.clientX, e.clientY));
  const handleClick = (e: PointerEvent<HTMLDivElement>) => {
    if (!ready) return;
    const uv = toUV(e.clientX, e.clientY);
    if (uv) onSelect(uv.u, uv.v, "new");
  };
  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!ready) return;
    const step = e.shiftKey ? 0.03 : 0.005;
    const base = active ?? { u: map.defaultTarget.u, v: map.defaultTarget.v };
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    onSelect(clamp(base.u + m[0]), clamp(base.v + m[1]), active ? "move" : "new");
  };

  const cursor = hover ? projectPoint(map, hover.u, hover.v) : null;
  const target = active ? projectPoint(map, active.u, active.v) : null;
  const isGlobal = map.geometry.type === "equirect";

  return (
    <section className="panel panel-brackets flex flex-col overflow-hidden">
      {/* Map tabs + view mode */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-2">
        <div className="flex flex-1 flex-wrap gap-1" role="tablist">
          {MARS_MAPS.map((m) => (
            <button
              key={m.id}
              role="tab"
              aria-selected={m.id === map.id}
              onClick={() => onMapChange(m.id)}
              className="group rounded-md border border-transparent px-3 py-1.5 text-start transition-all hover:bg-secondary aria-selected:border-primary/40 aria-selected:bg-primary/10"
            >
              <div className="font-display text-sm font-semibold tracking-wide group-aria-selected:text-primary">
                {t(`map.${m.id}.title` as TranslationKey)}
              </div>
              <div className="text-[0.68rem] text-muted-foreground">
                {t(`map.${m.id}.sub` as TranslationKey)}
              </div>
            </button>
          ))}
        </div>
        <div className="flex rounded-md border border-border bg-secondary/40 p-0.5">
          <Button
            variant="segment"
            size="sm"
            data-active={!native}
            onClick={() => setNative(false)}
          >
            <Maximize2 />
            {t("fitView")}
          </Button>
          <Button variant="segment" size="sm" data-active={native} onClick={() => setNative(true)}>
            <ScanSearch />
            {t("nativeView")}
          </Button>
        </div>
      </div>

      {/* Viewport */}
      <div
        className={`relative bg-background/60 ${native ? "max-h-[72vh] overflow-auto" : "flex items-center justify-center p-3"}`}
        dir="ltr"
      >
        <div
          key={map.id}
          className={`relative inline-block animate-rise ${ready ? "cursor-crosshair" : "cursor-wait"}`}
          onPointerMove={handleMove}
          onPointerLeave={() => setHover(null)}
          onPointerUp={handleClick}
          onKeyDown={handleKey}
          tabIndex={0}
          role="application"
          aria-label={t("mapAria")}
        >
          <img
            ref={imgRef}
            src={map.src}
            alt={t(`map.${map.id}.title` as TranslationKey)}
            width={map.width}
            height={map.height}
            draggable={false}
            className={`block select-none ${native ? "max-w-none" : "h-auto max-h-[68vh] w-auto max-w-full"}`}
            style={native ? { width: map.width, height: map.height } : undefined}
          />

          <div className="pointer-events-none absolute inset-0 grid-overlay opacity-60" />
          <div className="pointer-events-none absolute inset-0 scanlines" />

          {!ready && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden bg-background/40">
              <div className="absolute inset-x-0 h-1/3 bg-gradient-to-b from-transparent via-telemetry/25 to-transparent animate-sweep" />
              <div className="absolute inset-0 grid place-items-center">
                <span className="rounded bg-background/80 px-3 py-1 font-mono text-xs text-telemetry">
                  {t("calibrating")}
                </span>
              </div>
            </div>
          )}

          {/* Hover crosshair */}
          {hover && (
            <>
              <div
                className="pointer-events-none absolute inset-y-0 w-px bg-telemetry/60"
                style={{ left: `${hover.u * 100}%` }}
              />
              <div
                className="pointer-events-none absolute inset-x-0 h-px bg-telemetry/60"
                style={{ top: `${hover.v * 100}%` }}
              />
              <div
                className="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-telemetry"
                style={{ left: `${hover.u * 100}%`, top: `${hover.v * 100}%` }}
              />
            </>
          )}

          {/* Previous targets */}
          {others.map((o) => (
            <div
              key={o.id}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${o.u * 100}%`, top: `${o.v * 100}%` }}
            >
              <div className="size-2 rounded-full border border-foreground/70 bg-primary/60" />
            </div>
          ))}

          {/* Active target reticle */}
          {active && (
            <div
              key={active.id}
              className="pointer-events-none absolute"
              style={{ left: `${active.u * 100}%`, top: `${active.v * 100}%` }}
            >
              <div className="absolute left-0 top-0 size-10 rounded-full border-2 border-primary animate-reticle-pulse" />
              <div className="absolute left-0 top-0 size-12 rounded-full border border-dashed border-primary-glow animate-reticle-spin" />
              <div className="absolute left-0 top-0 h-16 w-px -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-transparent via-primary to-transparent" />
              <div className="absolute left-0 top-0 h-px w-16 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-primary to-transparent" />
              <div className="absolute left-0 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-ember" />
              <div className="absolute left-4 top-3 whitespace-nowrap rounded border border-primary/50 bg-background/85 px-1.5 py-0.5 font-mono text-[0.65rem] text-primary">
                {active.label}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live coordinate readout */}
      <div className="grid gap-px border-t border-border bg-border text-xs sm:grid-cols-2">
        <Readout
          label={t("cursor")}
          tone="telemetry"
          lines={
            cursor
              ? [
                  <>
                    <bdi dir="ltr">{formatLat(cursor.lat, lang)}</bdi>{" "}
                    <bdi dir="ltr">{formatLon(cursor.lon, lang)}</bdi>
                  </>,
                  `${t("pixel")} ${cursor.px}, ${cursor.py}${cursor.xKm !== undefined ? `  ·  ${t("grid")} ${cursor.xKm.toFixed(2)} / ${cursor.yKm?.toFixed(2)} km` : ""}`,
                ]
              : [t("clickHint"), t("keyboardHint")]
          }
        />
        <Readout
          label={t("target")}
          tone="primary"
          lines={
            target && active
              ? [
                  <>
                    <bdi dir="ltr" className="text-primary">
                      {active.label}
                    </bdi>{" "}
                    <bdi dir="ltr">{formatLat(target.lat, lang)}</bdi>{" "}
                    <bdi dir="ltr">{formatLon(target.lon, lang)}</bdi>
                  </>,
                  `${t("pixel")} ${target.px}, ${target.py}  ·  ${isGlobal ? t("globalRef") : t("localRef")}`,
                ]
              : [t("awaitingTarget"), `${t("resolution")} ${map.width}×${map.height}`]
          }
        />
      </div>
    </section>
  );
}

function Readout({
  label,
  lines,
  tone,
}: {
  label: string;
  lines: ReactNode[];
  tone: "primary" | "telemetry";
}) {
  return (
    <div className="bg-card px-3 py-2">
      <div
        className={`label-caps mb-0.5 ${tone === "primary" ? "!text-primary" : "!text-telemetry"}`}
      >
        {label}
      </div>
      {lines.map((l, i) => (
        <div
          key={i}
          className={`truncate font-mono ${i === 0 ? "text-foreground" : "text-muted-foreground"}`}
        >
          {l}
        </div>
      ))}
    </div>
  );
}
