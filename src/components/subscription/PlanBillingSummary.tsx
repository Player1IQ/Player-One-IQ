import Link from "next/link";
import { CreditCard, Sparkles } from "lucide-react";
import { UsageMeter } from "@/components/subscription/UsageMeter";
import { Badge } from "@/components/ui/Badge";
import { formatPlanPrice } from "@/lib/subscription/plans";
import { upgradePaths } from "@/lib/subscription/plans";
import {
  formatTrialCountdown,
  isPlatformTrialActive,
} from "@/lib/subscription/trials";
import type {
  OrganizationSubscription,
  PlanCode,
  UsageMetricKey,
  UsageSnapshot,
} from "@/lib/subscription/types";

interface PlanBillingSummaryProps {
  subscription: OrganizationSubscription | null;
  usage: UsageSnapshot[];
  /** Usage rows to highlight (defaults to creators). */
  highlightMetrics?: UsageMetricKey[];
  canViewBilling?: boolean;
}

export function PlanBillingSummary({
  subscription,
  usage,
  highlightMetrics = ["creators"],
  canViewBilling = true,
}: PlanBillingSummaryProps) {
  if (!canViewBilling) return null;

  const currentPlan = subscription?.plan;
  const planCode = currentPlan?.code;
  const upgrades = planCode ? (upgradePaths[planCode as PlanCode] ?? []) : [];
  const highlightedUsage = usage.filter((row) =>
    highlightMetrics.includes(row.metricKey)
  );
  const creatorUsage = usage.find((row) => row.metricKey === "creators");
  const atCreatorLimit =
    creatorUsage?.limit != null && creatorUsage.count >= creatorUsage.limit;

  const onPlatformTrial =
    subscription &&
    isPlatformTrialActive(
      subscription.status,
      subscription.trialEndsAt,
      subscription.stripeSubscriptionId
    );
  const trialLabel = formatTrialCountdown(subscription?.trialEndsAt ?? null);

  return (
    <section className="rounded-xl border border-white/[0.06] bg-surface-raised/80 p-5 backdrop-blur-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CreditCard className="h-4 w-4 text-accent-light" />
            <h2 className="text-sm font-semibold text-white">Plan & billing</h2>
            {subscription ? (
              <Badge variant="accent" className="capitalize">
                {onPlatformTrial ? "trialing" : subscription.status}
              </Badge>
            ) : null}
          </div>
          <p className="mt-2 text-lg font-semibold text-white">
            {currentPlan?.name ?? "No active plan"}
          </p>
          {currentPlan ? (
            <p className="mt-0.5 text-sm text-accent-light">
              {formatPlanPrice(
                subscription?.billingInterval === "yearly" &&
                  currentPlan.priceYearlyCents !== null
                  ? currentPlan.priceYearlyCents
                  : currentPlan.priceMonthlyCents,
                subscription?.billingInterval ?? "monthly"
              )}
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-gray-500">
              Choose a plan to unlock more creators and features.
            </p>
          )}
          {onPlatformTrial && trialLabel ? (
            <p className="mt-2 text-xs text-amber-200">{trialLabel}</p>
          ) : null}
          {atCreatorLimit ? (
            <p className="mt-2 text-sm text-amber-300">
              You&apos;ve reached your creator limit on this plan. Upgrade to add
              more roster profiles.
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/billing"
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
          >
            <Sparkles className="h-4 w-4" />
            {upgrades.length > 0 ? "View plans & upgrade" : "Manage billing"}
          </Link>
        </div>
      </div>

      <div className="mt-5 border-t border-white/[0.06] pt-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
          Usage on this plan
        </p>
        <UsageMeter
          usage={highlightedUsage.length > 0 ? highlightedUsage : usage}
        />
      </div>
    </section>
  );
}
