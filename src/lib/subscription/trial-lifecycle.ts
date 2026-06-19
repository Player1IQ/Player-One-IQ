import { createServiceClient } from "@/lib/supabase/admin";
import { parsePlanLimits } from "./plans";
import { getPostTrialPlanCode, appendTrialedPlan } from "./trials";
import type { FeatureKey, OrganizationSubscription } from "./types";

export async function expirePlatformTrialIfNeeded(
  subscription: OrganizationSubscription
): Promise<OrganizationSubscription> {
  if (subscription.stripeSubscriptionId) return subscription;
  if (subscription.status !== "trialing") return subscription;
  if (!subscription.trialEndsAt) return subscription;
  if (new Date(subscription.trialEndsAt) > new Date()) return subscription;

  const admin = createServiceClient();
  if (!admin) return subscription;

  const postTrialCode = getPostTrialPlanCode(subscription.plan.code);

  const { data: targetPlan } = await admin
    .from("subscription_plans")
    .select("id, code, name, description, tier_group, price_monthly_cents, price_yearly_cents, limits, features, sort_order")
    .eq("code", postTrialCode)
    .maybeSingle();

  if (!targetPlan) return subscription;

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);

  const { data: current } = await admin
    .from("organization_subscriptions")
    .select("metadata")
    .eq("id", subscription.id)
    .maybeSingle();

  const metadata = appendTrialedPlan(
    (current?.metadata ?? subscription.metadata) as Record<string, unknown>,
    subscription.plan.code
  );

  const { error } = await admin
    .from("organization_subscriptions")
    .update({
      plan_id: targetPlan.id,
      status: "active",
      trial_ends_at: null,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      metadata,
      updated_at: now.toISOString(),
    })
    .eq("id", subscription.id)
    .is("stripe_subscription_id", null)
    .eq("status", "trialing");

  if (error) {
    console.error("Failed to expire platform trial:", error.message);
    return subscription;
  }

  return {
    ...subscription,
    status: "active",
    trialEndsAt: null,
    metadata,
    plan: {
      id: targetPlan.id,
      code: targetPlan.code as OrganizationSubscription["plan"]["code"],
      name: targetPlan.name,
      description: targetPlan.description,
      tierGroup: targetPlan.tier_group as OrganizationSubscription["plan"]["tierGroup"],
      priceMonthlyCents: targetPlan.price_monthly_cents,
      priceYearlyCents: targetPlan.price_yearly_cents,
      limits: parsePlanLimits(targetPlan.limits),
      features: (Array.isArray(targetPlan.features)
        ? targetPlan.features
        : []) as FeatureKey[],
      sortOrder: targetPlan.sort_order,
    },
  };
}
