"use client";

import { Check, Loader2 } from "lucide-react";
import { formatPlanPrice, planHighlights, planRequiresStripeCheckout } from "@/lib/subscription/plans";
import { PLATFORM_TRIAL_DAYS } from "@/lib/subscription/trials";
import type { BillingInterval, PlanCode, SubscriptionPlan } from "@/lib/subscription/types";

interface SubscriptionPlanCardProps {
  plan: SubscriptionPlan;
  isCurrent: boolean;
  billingInterval: BillingInterval;
  onStartTrial?: (planCode: PlanCode) => void;
  onSubscribe?: (planCode: PlanCode) => void;
  onSwitchFree?: (planCode: PlanCode) => void;
  loadingTrial?: boolean;
  loadingSubscribe?: boolean;
  trialAvailable?: boolean;
  trialUsed?: boolean;
}

export function SubscriptionPlanCard({
  plan,
  isCurrent,
  billingInterval,
  onStartTrial,
  onSubscribe,
  onSwitchFree,
  loadingTrial = false,
  loadingSubscribe = false,
  trialAvailable = false,
  trialUsed = false,
}: SubscriptionPlanCardProps) {
  const highlights = planHighlights[plan.code];
  const priceCents =
    billingInterval === "yearly" && plan.priceYearlyCents !== null
      ? plan.priceYearlyCents
      : plan.priceMonthlyCents;
  const isPaid = planRequiresStripeCheckout(plan, billingInterval);
  const showTrialOption = isPaid && trialAvailable && !trialUsed && onStartTrial;
  const showSubscribeOption = isPaid && onSubscribe;
  const showFreeSwitch = !isPaid && onSwitchFree;

  return (
    <div
      className={`relative flex flex-col rounded-xl border p-6 ${
        isCurrent
          ? "border-accent/40 bg-accent/5 ring-1 ring-accent/20"
          : "border-border bg-surface-raised"
      }`}
    >
      {isCurrent ? (
        <span className="absolute right-4 top-4 rounded-full bg-accent/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-light">
          Current
        </span>
      ) : null}

      <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
      <p className="mt-1 text-sm text-gray-500">{highlights.tagline}</p>

      <p className="mt-4 text-3xl font-bold text-white">
        {formatPlanPrice(priceCents, billingInterval)}
      </p>

      <ul className="mt-6 flex-1 space-y-2">
        {highlights.bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2 text-sm text-gray-300">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-light" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      {!isCurrent && (showTrialOption || showSubscribeOption || showFreeSwitch) ? (
        <div className="mt-6 space-y-2">
          {showTrialOption ? (
            <button
              type="button"
              onClick={() => onStartTrial(plan.code)}
              disabled={loadingTrial || loadingSubscribe}
              className="w-full rounded-lg border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm font-medium text-accent-light transition-colors hover:bg-accent/20 disabled:opacity-50"
            >
              {loadingTrial ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting trial...
                </span>
              ) : (
                `Try free for ${PLATFORM_TRIAL_DAYS} days`
              )}
            </button>
          ) : null}
          {showSubscribeOption ? (
            <button
              type="button"
              onClick={() => onSubscribe(plan.code)}
              disabled={loadingTrial || loadingSubscribe}
              className={`w-full rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                showTrialOption
                  ? "border-border text-gray-200 hover:border-accent/30 hover:bg-accent/5"
                  : "border-border text-gray-200 hover:border-accent/30 hover:bg-accent/10"
              }`}
            >
              {loadingSubscribe ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting...
                </span>
              ) : trialUsed || !showTrialOption ? (
                `Subscribe to ${plan.name}`
              ) : (
                "Subscribe now — skip trial"
              )}
            </button>
          ) : null}
          {showFreeSwitch ? (
            <button
              type="button"
              onClick={() => onSwitchFree(plan.code)}
              disabled={loadingTrial || loadingSubscribe}
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-gray-200 transition-colors hover:border-accent/30 hover:bg-accent/10 disabled:opacity-50"
            >
              {loadingSubscribe ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </span>
              ) : (
                `Switch to ${plan.name}`
              )}
            </button>
          ) : null}
        </div>
      ) : isCurrent ? (
        <p className="mt-6 text-center text-xs text-gray-500">
          Active on your workspace
        </p>
      ) : null}
    </div>
  );
}
