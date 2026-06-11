"use client";

import { Check, Loader2 } from "lucide-react";
import { formatPlanPrice, planHighlights } from "@/lib/subscription/plans";
import type { BillingInterval, PlanCode, SubscriptionPlan } from "@/lib/subscription/types";

interface SubscriptionPlanCardProps {
  plan: SubscriptionPlan;
  isCurrent: boolean;
  billingInterval: BillingInterval;
  onSelect?: (planCode: PlanCode) => void;
  loading?: boolean;
}

export function SubscriptionPlanCard({
  plan,
  isCurrent,
  billingInterval,
  onSelect,
  loading = false,
}: SubscriptionPlanCardProps) {
  const highlights = planHighlights[plan.code];
  const priceCents =
    billingInterval === "yearly" && plan.priceYearlyCents !== null
      ? plan.priceYearlyCents
      : plan.priceMonthlyCents;

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

      {!isCurrent && onSelect ? (
        <button
          type="button"
          onClick={() => onSelect(plan.code)}
          disabled={loading}
          className="mt-6 w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-gray-200 transition-colors hover:border-accent/30 hover:bg-accent/10 disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating...
            </span>
          ) : (
            `Switch to ${plan.name}`
          )}
        </button>
      ) : isCurrent ? (
        <p className="mt-6 text-center text-xs text-gray-500">
          Active on your workspace
        </p>
      ) : null}
    </div>
  );
}
