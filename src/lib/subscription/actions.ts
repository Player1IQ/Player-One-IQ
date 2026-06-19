"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/admin";
import { getOrganizationId } from "@/lib/organization/queries";
import { requireBillingManageAccess } from "@/lib/permissions";
import type { BillingInterval, PlanCode } from "./types";
import { getSubscriptionPlans } from "./queries";
import { planRequiresStripeCheckout } from "./plans";
import {
  appendTrialedPlan,
  getPlatformTrialEndsAt,
  hasTrialedPlan,
  supportsPlatformTrial,
} from "./trials";

export async function startPlatformTrial(
  planCode: PlanCode,
  billingInterval: BillingInterval = "monthly"
) {
  const permError = await requireBillingManageAccess();
  if (permError) return permError;

  if (!supportsPlatformTrial(planCode)) {
    return { error: "This plan does not offer a platform trial." };
  }

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const plans = await getSubscriptionPlans();
  const plan = plans.find((p) => p.code === planCode);
  if (!plan) return { error: "Invalid plan selected." };

  const admin = createServiceClient();
  if (!admin) {
    return { error: "Billing service is not configured on the server." };
  }

  const { data: existing } = await admin
    .from("organization_subscriptions")
    .select("stripe_subscription_id, metadata")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (existing?.stripe_subscription_id) {
    return {
      error: "You have an active Stripe subscription. Use Manage billing to change plans.",
    };
  }

  const metadata = (existing?.metadata ?? {}) as Record<string, unknown>;
  if (hasTrialedPlan(metadata, planCode)) {
    return {
      error: `You've already used your ${plan.name} trial. Subscribe to continue on this plan.`,
    };
  }

  const now = new Date();
  const trialEndsAt = getPlatformTrialEndsAt(now);

  const { error } = await admin.from("organization_subscriptions").upsert(
    {
      organization_id: organizationId,
      plan_id: plan.id,
      status: "trialing",
      billing_interval: billingInterval,
      current_period_start: now.toISOString(),
      current_period_end: trialEndsAt,
      trial_ends_at: trialEndsAt,
      canceled_at: null,
      metadata: appendTrialedPlan(metadata, planCode),
      updated_at: now.toISOString(),
    },
    { onConflict: "organization_id" }
  );

  if (error) return { error: error.message };

  revalidatePath("/billing");
  revalidatePath("/settings");
  revalidatePath("/");

  return { success: true, planCode, trialing: true as const };
}

export async function changeSubscriptionPlan(
  planCode: PlanCode,
  billingInterval: BillingInterval = "monthly"
) {
  const permError = await requireBillingManageAccess();
  if (permError) return permError;

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const plans = await getSubscriptionPlans();
  const plan = plans.find((p) => p.code === planCode);
  if (!plan) return { error: "Invalid plan selected." };

  if (planRequiresStripeCheckout(plan, billingInterval)) {
    return {
      error: "Paid plans must be purchased through Stripe checkout on the billing page.",
    };
  }

  const admin = createServiceClient();
  if (!admin) {
    return { error: "Billing service is not configured on the server." };
  }

  const { data: existing } = await admin
    .from("organization_subscriptions")
    .select("stripe_subscription_id")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (existing?.stripe_subscription_id) {
    return {
      error: "You have an active Stripe subscription. Use Manage billing to change or cancel your plan.",
    };
  }

  const now = new Date();
  const periodEnd = new Date(now);
  if (billingInterval === "yearly") {
    periodEnd.setUTCFullYear(periodEnd.getUTCFullYear() + 1);
  } else {
    periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);
  }

  const { error } = await admin.from("organization_subscriptions").upsert(
    {
      organization_id: organizationId,
      plan_id: plan.id,
      status: "active",
      billing_interval: billingInterval,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      trial_ends_at: null,
      canceled_at: null,
      updated_at: now.toISOString(),
    },
    { onConflict: "organization_id" }
  );

  if (error) return { error: error.message };

  revalidatePath("/billing");
  revalidatePath("/settings");
  revalidatePath("/");

  return { success: true, planCode };
}

export async function cancelSubscription() {
  const permError = await requireBillingManageAccess();
  if (permError) return permError;

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const admin = createServiceClient();
  if (!admin) {
    return { error: "Billing service is not configured on the server." };
  }

  const { data: existing } = await admin
    .from("organization_subscriptions")
    .select("stripe_subscription_id")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (existing?.stripe_subscription_id) {
    return {
      error: "Cancel your subscription through Manage billing (Stripe customer portal).",
    };
  }

  const { error } = await admin
    .from("organization_subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId);

  if (error) return { error: error.message };

  revalidatePath("/billing");
  return { success: true };
}
