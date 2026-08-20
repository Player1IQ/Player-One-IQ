"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

interface CoachActivationCardProps {
  onActivate: () => void;
}

export function CoachActivationCard({ onActivate }: CoachActivationCardProps) {
  const t = useTranslations("coach.activation");

  return (
    <div className="rounded-2xl border border-dashed border-accent/25 bg-accent/5 px-6 py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 ring-1 ring-accent/25">
            <Sparkles className="h-5 w-5 text-accent-light" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{t("title")}</p>
            <p className="mt-1 text-sm text-gray-400">{t("description")}</p>
          </div>
        </div>
        <Button onClick={onActivate} className="shrink-0">
          {t("button")}
        </Button>
      </div>
    </div>
  );
}
