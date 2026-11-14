import { useI18n, type TranslationKey } from "@/lib/i18n";
import type { MapId } from "@/lib/mars-maps";
import type { Verdict } from "@/lib/recon-analysis";
import { verdictTone } from "@/components/recon/telemetry-charts";

export interface LogEntry {
  id: string;
  label: string;
  mapId: MapId;
  safety: number;
  verdict: Verdict;
}

interface TargetLogProps {
  entries: LogEntry[];
  activeId: string | null;
  onPick: (entry: LogEntry) => void;
}

export function TargetLog({ entries, activeId, onPick }: TargetLogProps) {
  const { t } = useI18n();
  return (
    <section className="panel panel-brackets p-3">
      <h2 className="label-caps mb-2 px-1">{t("targetLog")}</h2>
      {entries.length === 0 ? (
        <p className="px-1 py-2 text-xs text-muted-foreground">{t("noTargets")}</p>
      ) : (
        <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((e) => (
            <li key={e.id}>
              <button
                onClick={() => onPick(e)}
                data-active={e.id === activeId}
                className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-secondary/30 px-2.5 py-1.5 text-start transition-colors hover:bg-secondary data-[active=true]:border-primary/50 data-[active=true]:bg-primary/10"
              >
                <span>
                  <span className="block font-mono text-xs text-primary">{e.label}</span>
                  <span className="block text-[0.65rem] text-muted-foreground">
                    {t(`map.${e.mapId}.title` as TranslationKey)}
                  </span>
                </span>
                <span className="font-display text-lg font-semibold tabular-nums" style={{ color: verdictTone[e.verdict] }}>
                  {e.safety}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
