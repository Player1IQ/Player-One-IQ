import Link from "next/link";
import { Sparkles } from "lucide-react";

interface PlatformTrialBannerProps {
  planName: string;
  trialLabel: string;
}

export function PlatformTrialBanner({
  planName,
  trialLabel,
}: PlatformTrialBannerProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
          <Sparkles className="h-4 w-4 text-amber-300" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            Beta trial active — {planName}
          </p>
          <p className="mt-0.5 text-sm text-amber-100/80">
            {trialLabel}. Explore the full plan at no cost — no credit card required.
          </p>
        </div>
      </div>
      <Link
        href="/billing"
        className="inline-flex shrink-0 items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-surface hover:bg-amber-400"
      >
        View plan & billing
      </Link>
    </div>
  );
}
