import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
import type { TelemetryPoint } from "@/hooks/use-telemetry-stream";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import type { Composition, RiskBreakdown, Verdict } from "@/lib/recon-analysis";

export const tooltipStyle = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    color: "var(--popover-foreground)",
  },
  labelStyle: { color: "var(--muted-foreground)" },
  itemStyle: { color: "var(--popover-foreground)" },
  cursor: { stroke: "var(--telemetry)", strokeOpacity: 0.3 },
};

export const verdictTone: Record<Verdict, string> = {
  go: "var(--success)",
  caution: "var(--warning)",
  nogo: "var(--destructive)",
};

export function SafetyGauge({ score, verdict }: { score: number; verdict: Verdict }) {
  const { t } = useI18n();
  const shown = useAnimatedNumber(score);
  const color = verdictTone[verdict];
  return (
    <div className="relative h-44 w-full" dir="ltr">
      <ResponsiveContainer>
        <RadialBarChart
          data={[{ value: score }]}
          innerRadius="74%"
          outerRadius="100%"
          startAngle={220}
          endAngle={-40}
          barSize={14}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={8} fill={color} background={{ fill: "var(--muted)" }} animationDuration={700} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-display text-5xl font-bold tabular-nums" style={{ color }}>
            {Math.round(shown)}
          </div>
          <div className="label-caps">{t("safetyScore")}</div>
        </div>
      </div>
    </div>
  );
}

const RISK_KEYS: (keyof RiskBreakdown)[] = ["terrain", "slope", "hazard", "altitude", "thermal", "dust"];

export function RiskRadar({ risks }: { risks: RiskBreakdown }) {
  const { t } = useI18n();
  const data = RISK_KEYS.map((k) => ({ axis: t(`risk.${k}` as TranslationKey), value: risks[k] }));
  return (
    <div className="h-60 w-full" dir="ltr">
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            dataKey="value"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.28}
            strokeWidth={2}
            animationDuration={600}
          />
          <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}%`, ""]} separator="" />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

const MINERAL_KEYS: (keyof Composition)[] = ["basalt", "ironOxide", "sulfates", "clays", "dust"];
const MINERAL_COLORS = ["var(--chart-5)", "var(--chart-1)", "var(--chart-3)", "var(--chart-4)", "var(--chart-2)"];

export function CompositionDonut({ composition }: { composition: Composition }) {
  const { t } = useI18n();
  const data = MINERAL_KEYS.map((k) => ({ name: t(`min.${k}` as TranslationKey), value: composition[k] }));
  return (
    <div className="flex items-center gap-4">
      <div className="h-44 w-44 shrink-0" dir="ltr">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius="58%"
              outerRadius="92%"
              paddingAngle={2}
              stroke="var(--card)"
              animationDuration={700}
            >
              {data.map((d, i) => (
                <Cell key={d.name} fill={MINERAL_COLORS[i]} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} formatter={(v: number) => `${v}%`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex-1 space-y-2">
        {data.map((d, i) => (
          <li key={d.name} className="text-xs">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-sm" style={{ background: MINERAL_COLORS[i] }} />
                {d.name}
              </span>
              <span className="font-mono tabular-nums">{d.value}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${d.value}%`, background: MINERAL_COLORS[i] }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ThermalStream({ series, minC, maxC }: { series: TelemetryPoint[]; minC: number; maxC: number }) {
  const { t } = useI18n();
  return (
    <div className="h-48 w-full" dir="ltr">
      <ResponsiveContainer>
        <AreaChart data={series} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="thermalFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.55} />
              <stop offset="100%" stopColor="var(--telemetry)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            domain={[Math.floor(minC - 6), Math.ceil(maxC + 6)]}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            unit="°"
          />
          <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v} °C`, t("temperature")]} />
          <Area
            type="monotone"
            dataKey="temp"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#thermalFill)"
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface IceComparisonDatum {
  label: string;
  value: number;
  active: boolean;
}

export function IceComparison({ data }: { data: IceComparisonDatum[] }) {
  const { t } = useI18n();
  return (
    <div className="h-32 w-full" dir="ltr">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip {...tooltipStyle} cursor={{ fill: "var(--muted)", fillOpacity: 0.4 }} formatter={(v: number) => [`${v}%`, t("iceIndex")]} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={600}>
            {data.map((d) => (
              <Cell key={d.label} fill={d.active ? "var(--telemetry)" : "var(--chart-5)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
