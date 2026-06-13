import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";
import { getStripeWebhookSecret } from "@/lib/stripe/config";
import { syncOrganizationSubscriptionFromStripe } from "@/lib/stripe/sync-subscription";

export const runtime = "nodejs";

async function handleSubscriptionEvent(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata.organization_id;
  if (!organizationId) {
    console.error("Stripe subscription missing organization_id metadata");
    return;
  }

  const supabase = createServiceClient();
  if (!supabase) {
    console.error("Service client unavailable for Stripe webhook");
    return;
  }

  const result = await syncOrganizationSubscriptionFromStripe(
    supabase,
    organizationId,
    subscription
  );

  if (result.error) {
    console.error("Stripe subscription sync failed:", result.error);
  }
}

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const webhookSecret = getStripeWebhookSecret();

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.subscription) {
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        if (!subscription.metadata.organization_id && session.metadata?.organization_id) {
          subscription.metadata.organization_id = session.metadata.organization_id;
        }
        await handleSubscriptionEvent(subscription);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await handleSubscriptionEvent(event.data.object as Stripe.Subscription);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
