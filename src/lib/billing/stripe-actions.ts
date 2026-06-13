"use server";

import { createClient } from "@/lib/supabase/server";
import { getAppOrigin } from "@/lib/email/app-url";
import { getOrganizationId } from "@/lib/organization/queries";
import { requireBillingManageAccess } from "@/lib/permissions";
import { changeSubscriptionPlan } from "@/lib/subscription/actions";
import { getSubscriptionPlans } from "@/lib/subscription/queries";
import { planRequiresStripeCheckout } from "@/lib/subscription/plans";
import type { BillingInterval, PlanCode } from "@/lib/subscription/types";
import { getStripeClient } from "@/lib/stripe/client";
import { isStripeConfigured } from "@/lib/stripe/config";

async function getStripePriceId(
  planCode: PlanCode,
  billingInterval: BillingInterval
): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const column =
    billingInterval === "yearly"
      ? "stripe_price_id_yearly"
      : "stripe_price_id_monthly";

  const { data } = await supabase
    .from("subscription_plans")
    .select(column)
    .eq("code", planCode)
    .maybeSingle();

  if (!data) return null;
  return data[column as keyof typeof data] as string | null;
}

export async function startStripeCheckout(
  planCode: PlanCode,
  billingInterval: BillingInterval = "monthly"
) {
  const permError = await requireBillingManageAccess();
  if (permError) return permError;

  const plans = await getSubscriptionPlans();
  const plan = plans.find((p) => p.code === planCode);
  if (!plan) return { error: "Invalid plan selected." };

  if (!planRequiresStripeCheckout(plan, billingInterval)) {
    return changeSubscriptionPlan(planCode, billingInterval);
  }

  if (!isStripeConfigured()) {
    return { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to continue." };
  }

  const stripe = getStripeClient();
  if (!stripe) return { error: "Stripe client unavailable." };

  const stripePriceId = await getStripePriceId(planCode, billingInterval);
  if (!stripePriceId) {
    return {
      error:
        "This plan is not linked to Stripe yet. Run migration 021_stripe_price_ids.sql.",
    };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Sign in with an email address to checkout." };

  const { data: existingSub } = await supabase
    .from("organization_subscriptions")
    .select("stripe_customer_id")
    .eq("organization_id", organizationId)
    .maybeSingle();

  const origin = await getAppOrigin();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: existingSub?.stripe_customer_id ?? undefined,
    customer_email: existingSub?.stripe_customer_id ? undefined : user.email,
    line_items: [{ price: stripePriceId, quantity: 1 }],
    success_url: `${origin}/billing?checkout=success`,
    cancel_url: `${origin}/billing?checkout=canceled`,
    client_reference_id: organizationId,
    metadata: {
      organization_id: organizationId,
      plan_code: planCode,
      billing_interval: billingInterval,
    },
    subscription_data: {
      metadata: {
        organization_id: organizationId,
        plan_code: planCode,
      },
    },
  });

  if (!session.url) {
    return { error: "Could not start Stripe checkout." };
  }

  return { checkoutUrl: session.url };
}

export async function openStripeCustomerPortal() {
  const permError = await requireBillingManageAccess();
  if (permError) return permError;

  if (!isStripeConfigured()) {
    return { error: "Stripe is not configured." };
  }

  const stripe = getStripeClient();
  if (!stripe) return { error: "Stripe client unavailable." };

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { data: existingSub } = await supabase
    .from("organization_subscriptions")
    .select("stripe_customer_id")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!existingSub?.stripe_customer_id) {
    return { error: "No Stripe billing account yet. Subscribe to a paid plan first." };
  }

  const origin = await getAppOrigin();
  const session = await stripe.billingPortal.sessions.create({
    customer: existingSub.stripe_customer_id,
    return_url: `${origin}/billing`,
  });

  return { portalUrl: session.url };
}

export async function selectBillingPlan(
  planCode: PlanCode,
  billingInterval: BillingInterval = "monthly"
) {
  const plans = await getSubscriptionPlans();
  const plan = plans.find((p) => p.code === planCode);
  if (!plan) return { error: "Invalid plan selected." };

  if (planRequiresStripeCheckout(plan, billingInterval)) {
    return startStripeCheckout(planCode, billingInterval);
  }

  return changeSubscriptionPlan(planCode, billingInterval);
}
