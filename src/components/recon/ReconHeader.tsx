import { Info, Languages, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

interface ReconHeaderProps {
  onOpenGuide: () => void;
}

export function ReconHeader({ onOpenGuide }: ReconHeaderProps) {
  const { t, toggleLang } = useI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative grid size-9 place-items-center rounded-full bg-gradient-primary shadow-ember">
            <div className="size-3 rounded-full bg-background/80" />
            <div className="absolute inset-[-5px] rounded-full border border-dashed border-primary/50 animate-[spin_10s_linear_infinite]" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-bold tracking-[0.18em]" dir="ltr">
              ARES<span className="text-primary">·</span>RECON
            </div>
            <div className="label-caps !text-[0.6rem] !tracking-[0.2em]">{t("appTagline")}</div>
          </div>
        </div>

        <div className="ms-auto hidden items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 md:flex">
          <Radio className="size-3.5 text-success animate-blink" />
          <span className="font-mono text-xs text-success">{t("linkStatus")}</span>
        </div>

        <div className="ms-auto flex items-center gap-2 md:ms-0">
          <Button variant="console" size="sm" onClick={onOpenGuide} aria-label={t("guideAria")}>
            <Info />
            {t("guide")}
          </Button>
          <Button
            variant="ember"
            size="sm"
            onClick={toggleLang}
            aria-label={t("langAria")}
            className="min-w-[4.5rem]"
          >
            <Languages />
            {t("langToggle")}
          </Button>
        </div>
      </div>
    </header>
  );
}
