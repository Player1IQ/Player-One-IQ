import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import type { BillingInterval, SubscriptionStatus } from "@/lib/subscription/types";

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

export async function syncOrganizationSubscriptionFromStripe(
  supabase: SupabaseClient,
  organizationId: string,
  stripeSubscription: Stripe.Subscription
): Promise<{ error?: string }> {
  const priceId = stripeSubscription.items.data[0]?.price?.id;
  if (!priceId) {
    return { error: "Stripe subscription has no price item." };
  }

  const planId = await findPlanIdByStripePriceId(supabase, priceId);
  if (!planId) {
    return { error: `No plan mapped for Stripe price ${priceId}.` };
  }

  const billingPeriod = getSubscriptionBillingPeriod(stripeSubscription);
  if (!billingPeriod) {
    return { error: "Stripe subscription has no billing period." };
  }

  const customerId =
    typeof stripeSubscription.customer === "string"
      ? stripeSubscription.customer
      : stripeSubscription.customer.id;

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
