import Link from "next/link";
import { Sparkles } from "lucide-react";
import { upgradePaths } from "@/lib/subscription/plans";
import type { PlanCode, TierGroup } from "@/lib/subscription/types";

interface SubscriptionBannerProps {
  planName?: string;
  planCode?: PlanCode;
  tierGroup?: TierGroup;
}

export function SubscriptionBanner({
  planName,
  planCode,
  tierGroup,
}: SubscriptionBannerProps) {
  if (!planCode || !planName) return null;

  const upgrades = upgradePaths[planCode] ?? [];
  if (upgrades.length === 0) return null;

  const upgradeLabel =
    tierGroup === "creator"
      ? "Creator Pro"
      : tierGroup === "agency"
        ? "Agency Pro"
        : "Sponsor Pro";

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/20 bg-accent/5 px-5 py-4">
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-accent-light" />
        <div>
          <p className="text-sm font-medium text-white">
            You&apos;re on {planName}
          </p>
          <p className="text-sm text-gray-400">
            Upgrade to {upgradeLabel} for AI tools, advanced analytics, and more.
          </p>
        </div>
      </div>
      <Link
        href="/billing"
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
      >
        View plans
      </Link>
    </div>
  );
}
