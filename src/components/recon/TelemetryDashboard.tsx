import type { ReactNode } from "react";
import { Activity, Droplets, Gauge, Mountain, ShieldAlert, Thermometer, Wind } from "lucide-react";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
import { useTelemetryStream } from "@/hooks/use-telemetry-stream";
import { formatLat, formatLon, useI18n, type TranslationKey } from "@/lib/i18n";
import type { InspectionResult } from "@/lib/mars-maps";
import {
  CompositionDonut,
  IceComparison,
  RiskRadar,
  SafetyGauge,
  ThermalStream,
  verdictTone,
  type IceComparisonDatum,
} from "@/components/recon/telemetry-charts";

interface TelemetryDashboardProps {
  targetId: string | null;
  targetLabel: string | null;
  result: InspectionResult | null;
  iceComparison: IceComparisonDatum[];
}

export function TelemetryDashboard({
  targetId,
  targetLabel,
  result,
  iceComparison,
}: TelemetryDashboardProps) {
  const { t, lang } = useI18n();
  const series = useTelemetryStream(
    targetId,
    result?.analysis ?? null,
    result?.stats.roughness ?? 0,
  );
  const latest = series.at(-1);

  if (!result || !targetLabel) {
    return (
      <div className="panel panel-brackets grid min-h-[420px] place-items-center p-8 text-center">
        <div>
          <Activity className="mx-auto mb-3 size-8 text-telemetry animate-blink" />
          <div className="font-mono text-sm text-muted-foreground">{t("awaitingTarget")}</div>
        </div>
      </div>
    );
  }

  const a = result.analysis;
  const tone = verdictTone[a.verdict];

  return (
    <div key={targetId} className="space-y-4">
      {/* Site header */}
      <section className="panel panel-brackets overflow-hidden animate-rise">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <div className="label-caps">{t("selectedSite")}</div>
            <div className="font-mono text-sm">
              <bdi dir="ltr" className="text-primary">
                {targetLabel}
              </bdi>{" "}
              <span className="text-muted-foreground">
                <bdi dir="ltr">{formatLat(result.point.lat, lang)}</bdi> ·{" "}
                <bdi dir="ltr">{formatLon(result.point.lon, lang)}</bdi>
              </span>
            </div>
          </div>
          <div
            className="rounded-md border px-3 py-1.5 font-display text-sm font-bold tracking-widest"
            style={{ color: tone, borderColor: tone, boxShadow: `0 0 20px -6px ${tone}` }}
          >
            {t(`verdict.${a.verdict}` as TranslationKey)}
          </div>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <SafetyGauge score={a.safetyScore} verdict={a.verdict} />
          <div className="grid grid-cols-2 gap-2">
            <Stat
              icon={<ShieldAlert />}
              label={t("missionRisk")}
              value={a.riskPercent}
              unit="%"
              digits={0}
            />
            <Stat icon={<Gauge />} label={t("slope")} value={a.slopeDeg} unit="°" digits={1} />
            <Stat
              icon={<Mountain />}
              label={t("elevation")}
              value={a.elevationKm}
              unit="km"
              digits={1}
            />
            <Stat
              icon={<Droplets />}
              label={t("iceDistance")}
              value={a.ice.distanceKm}
              unit="km"
              digits={0}
            />
            <Stat
              icon={<Thermometer />}
              label={t("surfaceTemp")}
              value={a.temperature.meanC}
              unit="°C"
              digits={0}
              className="col-span-2"
              extra={
                <span className="font-mono text-[0.68rem] text-muted-foreground" dir="ltr">
                  {a.temperature.minC}° / {a.temperature.maxC}°
                </span>
              }
            />
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title={t("riskProfile")}>
          <RiskRadar risks={a.risks} />
        </Panel>
        <Panel title={t("composition")}>
          <CompositionDonut composition={a.composition} />
        </Panel>
      </div>

      <Panel
        title={t("thermalStream")}
        badge={
          <span className="flex items-center gap-1.5 rounded-full bg-destructive/15 px-2 py-0.5 font-mono text-[0.65rem] text-destructive">
            <span className="size-1.5 rounded-full bg-destructive animate-blink" />
            {t("live")}
          </span>
        }
      >
        <ThermalStream series={series} minC={a.temperature.minC} maxC={a.temperature.maxC} />
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Mini label={t("temperature")} value={latest ? `${latest.temp.toFixed(1)} °C` : "—"} />
          <Mini
            label={t("wind")}
            value={latest ? `${latest.wind.toFixed(1)} m/s` : "—"}
            icon={<Wind />}
          />
          <Mini label={t("pressure")} value={latest ? `${latest.pressure} Pa` : "—"} />
          <Mini label={t("localTime")} value={latest?.time ?? "—"} />
        </div>
      </Panel>

      <Panel title={t("iceProximity")}>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <div className="space-y-3">
            <Meter label={t("iceIndex")} value={a.ice.index} />
            <div className="grid grid-cols-2 gap-2">
              <Mini label={t("iceDepth")} value={`${a.ice.depthM} m`} />
              <Mini label={t("iceDist")} value={`${a.ice.distanceKm} km`} />
            </div>
          </div>
          <IceComparison data={iceComparison} />
        </div>
      </Panel>

      <p className="px-1 text-[0.7rem] text-muted-foreground">{t("footerNote")}</p>
    </div>
  );
}

function Panel({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="panel panel-brackets p-4 animate-rise">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="label-caps">{title}</h2>
        {badge}
      </div>
      {children}
    </section>
  );
}

function Stat({
  icon,
  label,
  value,
  unit,
  digits,
  extra,
  className = "",
}: {
  icon: ReactNode;
  label: string;
  value: number;
  unit: string;
  digits: number;
  extra?: ReactNode;
  className?: string;
}) {
  const shown = useAnimatedNumber(value);
  return (
    <div className={`rounded-lg border border-border bg-secondary/40 p-2.5 ${className}`}>
      <div className="flex items-center gap-1.5 text-muted-foreground [&_svg]:size-3.5 [&_svg]:text-telemetry">
        {icon}
        <span className="text-[0.68rem]">{label}</span>
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <span className="font-display text-xl font-semibold tabular-nums" dir="ltr">
          {shown.toFixed(digits)}
          <span className="ms-0.5 text-xs text-muted-foreground">{unit}</span>
        </span>
        {extra}
      </div>
    </div>
  );
}

function Mini({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-secondary/30 px-2.5 py-1.5">
      <div className="flex items-center gap-1 text-[0.65rem] text-muted-foreground [&_svg]:size-3">
        {icon}
        {label}
      </div>
      <div className="font-mono text-sm tabular-nums" dir="ltr">
        {value}
      </div>
    </div>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  const shown = useAnimatedNumber(value);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-display text-2xl font-semibold text-telemetry tabular-nums">
          {Math.round(shown)}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-telemetry shadow-glow transition-all duration-700"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
