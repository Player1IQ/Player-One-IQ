"use client";

import { useEffect, useState, useTransition } from "react";
import {
  CreditCard,
  FileText,
  Receipt,
  Sparkles,
  Zap,
  Crown,
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
import {
  formatTrialCountdown,
  isPlatformTrialActive,
} from "@/lib/subscription/trials";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { GlowCard } from "@/components/ui/GlowCard";
import { MetricCard } from "@/components/ui/MetricCard";

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
  const onPlatformTrial =
    subscription &&
    isPlatformTrialActive(
      subscription.status,
      subscription.trialEndsAt,
      subscription.stripeSubscriptionId
    );
  const trialLabel = formatTrialCountdown(subscription?.trialEndsAt ?? null);

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-fade-in">
      {onPlatformTrial && trialLabel ? (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <p className="font-medium">{trialLabel}</p>
          <p className="mt-1 text-xs text-amber-200/80">
            You&apos;re on a free {currentPlan?.name} trial with full feature access
            (usage caps apply). Subscribe before it ends to keep premium tools, or
            you&apos;ll move to the free tier for your organization type.
          </p>
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {message}
        </div>
      ) : null}

      {/* Plan hero */}
      <GlowCard intensity="high" className="overflow-hidden">
        <div className="relative p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-accent-light" />
                <Badge variant="accent">
                  {onPlatformTrial ? "trialing" : (subscription?.status ?? "none")}
                </Badge>
              </div>
              <h2 className="mt-3 text-3xl font-bold text-white">
                {currentPlan?.name ?? "No active plan"}
              </h2>
              <p className="mt-2 text-lg text-accent-light">
                {currentPlan
                  ? formatPlanPrice(
                      subscription?.billingInterval === "yearly" &&
                        currentPlan.priceYearlyCents !== null
                        ? currentPlan.priceYearlyCents
                        : currentPlan.priceMonthlyCents,
                      subscription?.billingInterval ?? "monthly"
                    )
                  : "Select a plan to get started"}
              </p>
              {onPlatformTrial && trialLabel ? (
                <p className="mt-2 text-sm text-amber-200">{trialLabel}</p>
              ) : null}
              {subscription && (
                <p className="mt-2 text-sm text-gray-500">
                  {new Date(subscription.currentPeriodStart).toLocaleDateString()} –{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  {" · "}
                  <span className="capitalize">{subscription.billingInterval}</span> billing
                </p>
              )}
            </div>
            {canManage && hasStripeCustomer && (
              <Button
                variant="secondary"
                onClick={handleManageBilling}
                disabled={portalPending}
              >
                <CreditCard className="h-4 w-4" />
                {portalPending ? "Opening portal..." : "Manage billing"}
              </Button>
            )}
          </div>
        </div>
      </GlowCard>

      {/* Usage meters */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="AI Requests"
          value={String(totalAiRequests)}
          subtitle="This billing period"
          icon={Sparkles}
          iconColor="text-accent-light"
        />
        <Card className="sm:col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Usage Meters</CardTitle>
            <CardDescription>Current billing period limits</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <UsageMeter usage={usage} />
          </CardContent>
        </Card>
      </div>

      {/* Plans comparison */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-accent-light" />
                Available Plans
              </CardTitle>
              <CardDescription>
                Paid plans checkout securely via Stripe
              </CardDescription>
            </div>
            <div className="flex rounded-xl border border-white/[0.08] p-1">
              {(["monthly", "yearly"] as const).map((interval) => (
                <button
                  key={interval}
                  type="button"
                  onClick={() => setBillingInterval(interval)}
                  className={`rounded-lg px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
                    billingInterval === interval
                      ? "bg-accent/20 text-accent-light shadow-glow-active"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {interval}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
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
          {!canManage && (
            <p className="mt-4 text-sm text-gray-500">
              Only organization owners and admins can change plans.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Payment & invoices */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card hover>
          <CardContent className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
              <CreditCard className="h-5 w-5 text-accent-light" />
            </div>
            <div>
              <CardTitle className="text-base">Payment method</CardTitle>
              <CardDescription className="mt-1">
                {hasStripeCustomer
                  ? "Update your card and payment details in the Stripe customer portal."
                  : "Subscribe to a paid plan to add a payment method."}
              </CardDescription>
              {canManage && hasStripeCustomer && (
                <button
                  type="button"
                  onClick={handleManageBilling}
                  disabled={portalPending}
                  className="mt-3 text-sm text-accent-light hover:underline"
                >
                  Open billing portal
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-overlay ring-1 ring-white/10">
              <Receipt className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <CardTitle className="text-base">Invoice history</CardTitle>
              <CardDescription className="mt-1">
                {hasStripeCustomer
                  ? "View receipts and past invoices in the Stripe customer portal."
                  : "Invoices appear after your first paid subscription."}
              </CardDescription>
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
                <FileText className="h-4 w-4" />
                {hasStripeCustomer ? "Managed by Stripe" : "No invoices yet"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
