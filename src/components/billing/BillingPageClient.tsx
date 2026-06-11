"use client";

import { useState, useTransition } from "react";
import {
  CreditCard,
  FileText,
  Receipt,
  Sparkles,
} from "lucide-react";
import { changeSubscriptionPlan } from "@/lib/subscription/actions";
import { SubscriptionPlanCard } from "@/components/subscription/SubscriptionPlanCard";
import { UsageMeter } from "@/components/subscription/UsageMeter";
import type {
  AiUsageSummary,
  BillingInterval,
  FeatureKey,
  OrganizationSubscription,
  PlanCode,
  SubscriptionPlan,
  UsageSnapshot,
} from "@/lib/subscription/types";
import { formatPlanPrice } from "@/lib/subscription/plans";

interface BillingPageClientProps {
  subscription: OrganizationSubscription | null;
  usage: UsageSnapshot[];
  aiUsage: AiUsageSummary[];
  tierPlans: SubscriptionPlan[];
  canManage: boolean;
  features: FeatureKey[];
}

export function BillingPageClient({
  subscription,
  usage,
  aiUsage,
  tierPlans,
  canManage,
}: BillingPageClientProps) {
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("monthly");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pendingPlan, setPendingPlan] = useState<PlanCode | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentPlan = subscription?.plan;

  function handlePlanChange(planCode: PlanCode) {
    if (!canManage) return;
    setError("");
    setMessage("");
    setPendingPlan(planCode);

    startTransition(async () => {
      const result = await changeSubscriptionPlan(planCode, billingInterval);
      setPendingPlan(null);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setMessage(`Plan updated. Stripe checkout will be connected in a future release.`);
    });
  }

  const totalAiRequests = aiUsage.reduce((sum, row) => sum + row.requestCount, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {error ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {message}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface-raised p-6 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-white">Current plan</h2>
              <p className="mt-1 text-sm text-gray-500">
                Subscription status and billing period
              </p>
            </div>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium capitalize text-accent-light ring-1 ring-accent/20">
              {subscription?.status ?? "none"}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border-subtle bg-surface px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">Plan</p>
              <p className="mt-1 text-xl font-semibold text-white">
                {currentPlan?.name ?? "—"}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {currentPlan
                  ? formatPlanPrice(
                      subscription?.billingInterval === "yearly" &&
                        currentPlan.priceYearlyCents !== null
                        ? currentPlan.priceYearlyCents
                        : currentPlan.priceMonthlyCents,
                      subscription?.billingInterval ?? "monthly"
                    )
                  : "—"}
              </p>
            </div>
            <div className="rounded-lg border border-border-subtle bg-surface px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Billing period
              </p>
              <p className="mt-1 text-sm text-gray-300">
                {subscription
                  ? `${new Date(subscription.currentPeriodStart).toLocaleDateString()} – ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                  : "—"}
              </p>
              <p className="mt-1 text-xs capitalize text-gray-500">
                {subscription?.billingInterval ?? "monthly"} billing
              </p>
            </div>
          </div>

          {!canManage ? (
            <p className="mt-4 text-sm text-gray-500">
              Only organization owners and admins can change plans.
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-border bg-surface-raised p-6">
          <h2 className="text-base font-semibold text-white">Usage</h2>
          <p className="mt-1 text-sm text-gray-500">Current billing period</p>
          <div className="mt-6">
            <UsageMeter usage={usage} />
          </div>
          <div className="mt-6 rounded-lg border border-border-subtle bg-surface px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              AI requests this month
            </p>
            <p className="mt-1 text-lg font-semibold text-white">
              {totalAiRequests}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface-raised p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-white">
              <Sparkles className="h-5 w-5 text-accent-light" />
              Available plans
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Compare plans in your tier. Payment processing via Stripe coming soon.
            </p>
          </div>
          <div className="flex rounded-lg border border-border p-1">
            {(["monthly", "yearly"] as const).map((interval) => (
              <button
                key={interval}
                type="button"
                onClick={() => setBillingInterval(interval)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  billingInterval === interval
                    ? "bg-accent/20 text-accent-light"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {interval}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {tierPlans.map((plan) => (
            <SubscriptionPlanCard
              key={plan.id}
              plan={plan}
              isCurrent={plan.code === currentPlan?.code}
              billingInterval={billingInterval}
              onSelect={canManage ? handlePlanChange : undefined}
              loading={isPending && pendingPlan === plan.code}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-dashed border-border bg-surface-raised p-6">
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-gray-500" />
            <div>
              <h2 className="text-base font-semibold text-white">
                Payment method
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Stripe payment method management will appear here once billing is
                connected.
              </p>
              <span className="mt-3 inline-block rounded-full bg-surface px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Coming soon
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-border bg-surface-raised p-6">
          <div className="flex items-start gap-3">
            <Receipt className="h-5 w-5 text-gray-500" />
            <div>
              <h2 className="text-base font-semibold text-white">
                Invoice history
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Past invoices and receipts will be listed here after Stripe
                integration.
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <FileText className="h-4 w-4" />
                No invoices yet
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
