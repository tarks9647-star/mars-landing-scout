import { Crosshair, Globe2, Languages, ListChecks, Satellite } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n, type TranslationKey } from "@/lib/i18n";

interface GuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FEATURES: { icon: typeof Globe2; title: TranslationKey; desc: TranslationKey }[] = [
  { icon: Globe2, title: "feature.maps.title", desc: "feature.maps.desc" },
  { icon: Crosshair, title: "feature.inspect.title", desc: "feature.inspect.desc" },
  { icon: Satellite, title: "feature.telemetry.title", desc: "feature.telemetry.desc" },
  { icon: ListChecks, title: "feature.log.title", desc: "feature.log.desc" },
  { icon: Languages, title: "feature.lang.title", desc: "feature.lang.desc" },
];

const STEPS: TranslationKey[] = ["step.1", "step.2", "step.3", "step.4", "step.5"];

export function GuideDialog({ open, onOpenChange }: GuideDialogProps) {
  const { t, dir } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={dir}
        className="panel panel-brackets max-h-[88vh] max-w-2xl overflow-y-auto border-telemetry/30 p-0 sm:rounded-xl"
      >
        <div className="relative overflow-hidden border-b border-border px-6 pb-5 pt-6 scanlines">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-telemetry/10 to-transparent" />
          <DialogHeader className="relative text-start">
            <div className="label-caps text-telemetry">ARES·RECON // BRIEFING</div>
            <DialogTitle className="font-display text-2xl tracking-wide">
              {t("guideTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {t("guideIntro")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-6 px-6 py-5">
          <section>
            <h3 className="label-caps mb-3">{t("guideFeaturesTitle")}</h3>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {FEATURES.map(({ icon: Icon, title, desc }, i) => (
                <div
                  key={title}
                  className="flex gap-3 rounded-lg border border-border bg-secondary/40 p-3 animate-rise"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="grid size-8 shrink-0 place-items-center rounded-md bg-telemetry/10 text-telemetry">
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <div className="font-display text-sm font-semibold">{t(title)}</div>
                    <div className="text-xs leading-relaxed text-muted-foreground">{t(desc)}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="label-caps mb-3">{t("guideStepsTitle")}</h3>
            <ol className="space-y-2">
              {STEPS.map((step, i) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border border-primary/50 font-mono text-xs text-primary">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 text-sm">{t(step)}</span>
                </li>
              ))}
            </ol>
          </section>

          <p className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs leading-relaxed text-warning">
            {t("guideNote")}
          </p>

          <div className="flex justify-end">
            <Button variant="ember" onClick={() => onOpenChange(false)}>
              {t("guideClose")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
