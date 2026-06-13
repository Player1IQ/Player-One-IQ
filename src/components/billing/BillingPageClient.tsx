"use client";

import { useEffect, useState, useTransition } from "react";
import {
  CreditCard,
  FileText,
  Receipt,
  Sparkles,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  openStripeCustomerPortal,
  selectBillingPlan,
} from "@/lib/billing/stripe-actions";
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
  const searchParams = useSearchParams();
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("monthly");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pendingPlan, setPendingPlan] = useState<PlanCode | null>(null);
  const [isPending, startTransition] = useTransition();
  const [portalPending, startPortalTransition] = useTransition();

  const currentPlan = subscription?.plan;
  const hasStripeCustomer = Boolean(subscription?.stripeCustomerId);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      setMessage("Payment successful. Your plan will update in a few seconds.");
    } else if (checkout === "canceled") {
      setMessage("Checkout canceled. No changes were made.");
    }
  }, [searchParams]);

  function handlePlanChange(planCode: PlanCode) {
    if (!canManage) return;
    setError("");
    setMessage("");
    setPendingPlan(planCode);

    startTransition(async () => {
      const result = await selectBillingPlan(planCode, billingInterval);
      setPendingPlan(null);

      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }

      if ("checkoutUrl" in result && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      if ("success" in result && result.success) {
        setMessage(`Plan updated to ${planCode.replace(/_/g, " ")}.`);
      }
    });
  }

  function handleManageBilling() {
    setError("");
    startPortalTransition(async () => {
      const result = await openStripeCustomerPortal();
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      if ("portalUrl" in result && result.portalUrl) {
        window.location.href = result.portalUrl;
      }
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

          {canManage && hasStripeCustomer ? (
            <button
              type="button"
              onClick={handleManageBilling}
              disabled={portalPending}
              className="mt-4 rounded-lg border border-border px-4 py-2 text-sm text-gray-200 hover:border-accent/30"
            >
              {portalPending ? "Opening portal..." : "Manage payment & invoices"}
            </button>
          ) : null}

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
              Paid plans checkout securely via Stripe.
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
        <div className="rounded-xl border border-border bg-surface-raised p-6">
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-gray-500" />
            <div>
              <h2 className="text-base font-semibold text-white">
                Payment method
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {hasStripeCustomer
                  ? "Update your card and payment details in the Stripe customer portal."
                  : "Subscribe to a paid plan to add a payment method."}
              </p>
              {canManage && hasStripeCustomer ? (
                <button
                  type="button"
                  onClick={handleManageBilling}
                  disabled={portalPending}
                  className="mt-3 text-sm text-accent-light hover:underline"
                >
                  Open billing portal
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface-raised p-6">
          <div className="flex items-start gap-3">
            <Receipt className="h-5 w-5 text-gray-500" />
            <div>
              <h2 className="text-base font-semibold text-white">
                Invoice history
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {hasStripeCustomer
                  ? "View receipts and past invoices in the Stripe customer portal."
                  : "Invoices appear after your first paid subscription."}
              </p>
              {hasStripeCustomer ? (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
                  <FileText className="h-4 w-4" />
                  Managed by Stripe
                </div>
              ) : (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  No invoices yet
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
