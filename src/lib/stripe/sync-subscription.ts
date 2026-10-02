import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { findPlanCodeForTestStripePriceId } from "@/lib/stripe/test-prices";
import { getPostTrialPlanCode } from "@/lib/subscription/trials";
import type {
  BillingInterval,
  PlanCode,
  SubscriptionStatus,
} from "@/lib/subscription/types";

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "canceled";
    case "paused":
      return "paused";
    default:
      return "active";
  }
}

function mapBillingInterval(
  interval: Stripe.Price.Recurring.Interval | undefined
): BillingInterval {
  return interval === "year" ? "yearly" : "monthly";
}

/** Stripe API 2026+ exposes billing period on subscription items, not the subscription. */
function getSubscriptionBillingPeriod(
  stripeSubscription: Stripe.Subscription
): { periodStart: number; periodEnd: number } | null {
  const primaryItem = stripeSubscription.items.data[0];
  if (
    primaryItem &&
    typeof primaryItem.current_period_start === "number" &&
    typeof primaryItem.current_period_end === "number"
  ) {
    return {
      periodStart: primaryItem.current_period_start,
      periodEnd: primaryItem.current_period_end,
    };
  }

  // Webhook payloads from older API versions may still include top-level fields.
  const legacySubscription = stripeSubscription as Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };
  if (
    typeof legacySubscription.current_period_start === "number" &&
    typeof legacySubscription.current_period_end === "number"
  ) {
    return {
      periodStart: legacySubscription.current_period_start,
      periodEnd: legacySubscription.current_period_end,
    };
  }

  return null;
}

async function findPlanIdByStripePriceId(
  supabase: SupabaseClient,
  priceId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("subscription_plans")
    .select("id")
    .or(
      `stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`
    )
    .maybeSingle();

  return data?.id ?? null;
}

async function findPlanIdByCode(
  supabase: SupabaseClient,
  planCode: string
): Promise<string | null> {
  const { data } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("code", planCode)
    .maybeSingle();
  return data?.id ?? null;
}

async function findPlanIdForStripeSubscription(
  supabase: SupabaseClient,
  priceId: string,
  metadataPlanCode: string | undefined
): Promise<string | null> {
  const byPrice = await findPlanIdByStripePriceId(supabase, priceId);
  if (byPrice) return byPrice;

  const testPlanCode = findPlanCodeForTestStripePriceId(priceId);
  if (testPlanCode) {
    const byTestPrice = await findPlanIdByCode(supabase, testPlanCode);
    if (byTestPrice) return byTestPrice;
  }

  if (metadataPlanCode) {
    return findPlanIdByCode(supabase, metadataPlanCode);
  }

  return null;
}

function isEndedStripeSubscription(
  stripeSubscription: Stripe.Subscription
): boolean {
  return (
    stripeSubscription.status === "canceled" ||
    stripeSubscription.status === "incomplete_expired"
  );
}

export async function syncOrganizationSubscriptionFromStripe(
  supabase: SupabaseClient,
  organizationId: string,
  stripeSubscription: Stripe.Subscription
): Promise<{ error?: string }> {
  const customerId =
    typeof stripeSubscription.customer === "string"
      ? stripeSubscription.customer
      : stripeSubscription.customer.id;

  if (isEndedStripeSubscription(stripeSubscription)) {
    const paidPlanCode = stripeSubscription.metadata?.plan_code as
      | PlanCode
      | undefined;
    const starterCode = paidPlanCode
      ? getPostTrialPlanCode(paidPlanCode)
      : "agency_starter";
    const starterPlanId = await findPlanIdByCode(supabase, starterCode);
    if (!starterPlanId) {
      return { error: `No plan mapped for ${starterCode}.` };
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);

    const { error } = await supabase.from("organization_subscriptions").upsert(
      {
        organization_id: organizationId,
        plan_id: starterPlanId,
        status: "active",
        billing_interval: "monthly",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        trial_ends_at: null,
        canceled_at: stripeSubscription.canceled_at
          ? new Date(stripeSubscription.canceled_at * 1000).toISOString()
          : now.toISOString(),
        stripe_customer_id: customerId,
        stripe_subscription_id: null,
        updated_at: now.toISOString(),
      },
      { onConflict: "organization_id" }
    );

    if (error) return { error: error.message };
    return {};
  }

  const priceId = stripeSubscription.items.data[0]?.price?.id;
  if (!priceId) {
    return { error: "Stripe subscription has no price item." };
  }

  const planId = await findPlanIdForStripeSubscription(
    supabase,
    priceId,
    stripeSubscription.metadata?.plan_code
  );
  if (!planId) {
    return { error: `No plan mapped for Stripe price ${priceId}.` };
  }

  const billingPeriod = getSubscriptionBillingPeriod(stripeSubscription);
  if (!billingPeriod) {
    return { error: "Stripe subscription has no billing period." };
  }

  const { error } = await supabase.from("organization_subscriptions").upsert(
    {
      organization_id: organizationId,
      plan_id: planId,
      status: mapStripeStatus(stripeSubscription.status),
      billing_interval: mapBillingInterval(
        stripeSubscription.items.data[0]?.price?.recurring?.interval
      ),
      current_period_start: new Date(
        billingPeriod.periodStart * 1000
      ).toISOString(),
      current_period_end: new Date(billingPeriod.periodEnd * 1000).toISOString(),
      trial_ends_at: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000).toISOString()
        : null,
      canceled_at: stripeSubscription.canceled_at
        ? new Date(stripeSubscription.canceled_at * 1000).toISOString()
        : stripeSubscription.cancel_at_period_end
          ? new Date().toISOString()
          : null,
      stripe_customer_id: customerId,
      stripe_subscription_id: stripeSubscription.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organization_id" }
  );

  if (error) return { error: error.message };
  return {};
}
