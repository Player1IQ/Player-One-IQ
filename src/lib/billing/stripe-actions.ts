"use server";

import { createClient } from "@/lib/supabase/server";
import { getAppOrigin } from "@/lib/email/app-url";
import { getOrganizationId } from "@/lib/organization/queries";
import { requireBillingManageAccess } from "@/lib/permissions";
import { changeSubscriptionPlan, startPlatformTrial } from "@/lib/subscription/actions";
import { getSubscriptionPlans } from "@/lib/subscription/queries";
import { planRequiresStripeCheckout, isSelfServeCheckoutPlan, SPONSOR_PRO_REQUEST_ONLY_MESSAGE } from "@/lib/subscription/plans";
import type { BillingInterval, PlanCode } from "@/lib/subscription/types";
import { getStripeClient } from "@/lib/stripe/client";
import { isStripeConfigured } from "@/lib/stripe/config";
import { TEST_STRIPE_PRICE_IDS } from "@/lib/stripe/test-prices";
import { createServiceClient } from "@/lib/supabase/admin";
import { syncOrganizationSubscriptionFromStripe } from "@/lib/stripe/sync-subscription";

function isStripeTestMode(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_"));
}

async function getStripePriceId(
  planCode: PlanCode,
  billingInterval: BillingInterval
): Promise<string | null> {
  if (isStripeTestMode()) {
    const testPriceId = TEST_STRIPE_PRICE_IDS[planCode]?.[billingInterval];
    if (testPriceId) return testPriceId;
  }

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

  if (!isSelfServeCheckoutPlan(planCode)) {
    return { error: SPONSOR_PRO_REQUEST_ONLY_MESSAGE };
  }

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

  let stripeCustomerId = existingSub?.stripe_customer_id ?? undefined;
  if (stripeCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(stripeCustomerId);
      if ("deleted" in customer && customer.deleted) {
        stripeCustomerId = undefined;
      }
    } catch {
      stripeCustomerId = undefined;
    }
  }

  const origin = await getAppOrigin();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      customer_email: stripeCustomerId ? undefined : user.email,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: `${origin}/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    console.error("Stripe checkout session failed:", message);
    if (message.includes("No such price")) {
      return {
        error: isStripeTestMode()
          ? "This plan's Stripe price is not in test mode. Local checkout needs test Price IDs; the $1 live smoke has to run on www.playeroneiq.com."
          : "Stripe does not have this plan's price in live mode. Check the Price ID in the Stripe dashboard.",
      };
    }
    return { error: "Could not start Stripe checkout. Try again." };
  }
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
    return_url: `${origin}/billing?portal=return`,
  });

  return { portalUrl: session.url };
}

export async function openStripeCancelPortal() {
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
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!existingSub?.stripe_customer_id || !existingSub.stripe_subscription_id) {
    return { error: "No active Stripe subscription to cancel." };
  }

  const origin = await getAppOrigin();
  const returnUrl = `${origin}/billing?subscription=canceled`;

  const stripeSubscription = await stripe.subscriptions.retrieve(
    existingSub.stripe_subscription_id
  );

  if (
    stripeSubscription.cancel_at_period_end ||
    stripeSubscription.status === "canceled" ||
    stripeSubscription.status === "incomplete_expired"
  ) {
    const admin = createServiceClient();
    if (admin) {
      await syncOrganizationSubscriptionFromStripe(
        admin,
        organizationId,
        stripeSubscription
      );
    }
    return { alreadyCanceled: true as const };
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: existingSub.stripe_customer_id,
      return_url: returnUrl,
      flow_data: {
        type: "subscription_cancel",
        subscription_cancel: {
          subscription: existingSub.stripe_subscription_id,
        },
        after_completion: {
          type: "redirect",
          redirect: {
            return_url: returnUrl,
          },
        },
      },
    });

    return { portalUrl: session.url };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("already set to be canceled")) {
      const admin = createServiceClient();
      if (admin) {
        await syncOrganizationSubscriptionFromStripe(
          admin,
          organizationId,
          stripeSubscription
        );
      }
      return { alreadyCanceled: true as const };
    }
    console.error("Stripe cancel portal failed:", message);
    return { error: "Could not open the cancellation page. Try Manage billing." };
  }
}

export async function syncCurrentStripeSubscription() {
  const permError = await requireBillingManageAccess();
  if (permError) return permError;

  const stripe = getStripeClient();
  if (!stripe) return { error: "Stripe client unavailable." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const { data: existingSub } = await supabase
    .from("organization_subscriptions")
    .select("stripe_subscription_id")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!existingSub?.stripe_subscription_id) {
    return { success: true as const };
  }

  const subscription = await stripe.subscriptions.retrieve(
    existingSub.stripe_subscription_id
  );

  const admin = createServiceClient();
  if (!admin) return { error: "Could not update your plan." };

  const result = await syncOrganizationSubscriptionFromStripe(
    admin,
    organizationId,
    subscription
  );
  if (result.error) return { error: result.error };
  return { success: true as const };
}

export async function syncCheckoutSession(sessionId: string) {
  const permError = await requireBillingManageAccess();
  if (permError) return permError;

  if (!sessionId.startsWith("cs_")) {
    return { error: "Invalid checkout session." };
  }

  const stripe = getStripeClient();
  if (!stripe) return { error: "Stripe client unavailable." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const sessionOrgId =
    session.client_reference_id ?? session.metadata?.organization_id ?? null;
  if (sessionOrgId !== organizationId) {
    return { error: "This checkout session does not belong to your workspace." };
  }

  if (session.mode !== "subscription" || !session.subscription) {
    return { error: "Checkout did not create a subscription." };
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  if (!subscription.metadata.organization_id && session.metadata?.organization_id) {
    subscription.metadata.organization_id = session.metadata.organization_id;
  }

  const admin = createServiceClient();
  if (!admin) return { error: "Could not update your plan." };

  const result = await syncOrganizationSubscriptionFromStripe(
    admin,
    organizationId,
    subscription
  );
  if (result.error) return { error: result.error };
  return { success: true as const };
}

export type BillingPlanMode = "trial" | "subscribe";

export async function selectBillingPlan(
  planCode: PlanCode,
  billingInterval: BillingInterval = "monthly",
  mode: BillingPlanMode = "subscribe"
) {
  const plans = await getSubscriptionPlans();
  const plan = plans.find((p) => p.code === planCode);
  if (!plan) return { error: "Invalid plan selected." };

  if (!isSelfServeCheckoutPlan(planCode)) {
    return { error: SPONSOR_PRO_REQUEST_ONLY_MESSAGE };
  }

  if (!planRequiresStripeCheckout(plan, billingInterval)) {
    return changeSubscriptionPlan(planCode, billingInterval);
  }

  if (mode === "trial") {
    return startPlatformTrial(planCode, billingInterval);
  }

  return startStripeCheckout(planCode, billingInterval);
}
