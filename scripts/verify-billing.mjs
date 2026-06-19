#!/usr/bin/env node
/**
 * Stripe billing readiness check (test or live keys from .env.local).
 * Usage: node scripts/verify-billing.mjs [appUrl]
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import Stripe from "stripe";

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const fileEnv = loadEnvFile(resolve(process.cwd(), ".env.local"));
const env = { ...fileEnv, ...process.env };

const appUrl = (
  process.argv[2] ??
  env.NEXT_PUBLIC_APP_URL ??
  "https://player-one-iq.vercel.app"
).replace(/\/$/, "");

const webhookPath = "/api/billing/webhook";
const expectedWebhookUrl = `${appUrl}${webhookPath}`;
const requiredEvents = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
];

const priceIds = {
  creator_pro_monthly: "price_1ThuXdHRtLHXdGBBFA4vL7i5",
  creator_pro_yearly: "price_1ThuZKHRtLHXdGBBE1hjVhGy",
  agency_monthly: "price_1ThuWNHRtLHXdGBBlsPAm8aD",
  agency_yearly: "price_1ThucaHRtLHXdGBBVozTY3Zu",
  agency_pro_monthly: "price_1ThuaGHRtLHXdGBBKUP8b4Hj",
  agency_pro_yearly: "price_1ThuamHRtLHXdGBBsuwvu8fI",
  sponsor_pro_monthly: "price_1ThubXHRtLHXdGBBWKYsvvt5",
  sponsor_pro_yearly: "price_1Thuc0HRtLHXdGBBpsBSiz5I",
};

async function main() {
  console.log("\nPlayer One IQ — Stripe billing check\n");
  console.log(`App URL: ${appUrl}`);
  console.log(`Expected webhook: ${expectedWebhookUrl}\n`);

  const secretKey = env.STRIPE_SECRET_KEY?.trim();
  const publishableKey = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET?.trim();

  let failed = 0;

  if (!secretKey) {
    console.log("✗ STRIPE_SECRET_KEY — MISSING");
    failed += 1;
  } else {
    const mode = secretKey.startsWith("sk_live_") ? "live" : "test";
    console.log(`✓ STRIPE_SECRET_KEY (${mode} mode)`);
  }

  if (!publishableKey) {
    console.log("✗ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — MISSING");
    failed += 1;
  } else {
    console.log("✓ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  }

  if (!webhookSecret) {
    console.log("✗ STRIPE_WEBHOOK_SECRET — MISSING");
    failed += 1;
  } else {
    console.log("✓ STRIPE_WEBHOOK_SECRET");
  }

  if (!secretKey) {
    console.log(`\n${failed} required variable(s) missing.\n`);
    process.exit(1);
  }

  const stripe = new Stripe(secretKey);

  console.log("\nStripe Price IDs (migration 021):\n");
  for (const [label, priceId] of Object.entries(priceIds)) {
    try {
      const price = await stripe.prices.retrieve(priceId);
      const productName =
        typeof price.product === "string"
          ? price.product
          : price.product?.name ?? "product";
      const amount = price.unit_amount
        ? `$${(price.unit_amount / 100).toFixed(2)}`
        : "custom";
      const active = price.active ? "active" : "inactive";
      console.log(`✓ ${label} — ${priceId} (${amount}/${price.recurring?.interval ?? "once"}, ${active})`);
      if (!price.active) failed += 1;
    } catch {
      console.log(`✗ ${label} — ${priceId} not found in this Stripe account`);
      failed += 1;
    }
  }

  console.log("\nStripe webhook endpoints:\n");
  const endpoints = await stripe.webhookEndpoints.list({ limit: 20 });
  const matching = endpoints.data.filter((endpoint) =>
    endpoint.url.includes(webhookPath)
  );

  if (matching.length === 0) {
    console.log(`✗ No webhook endpoint for ${webhookPath}`);
    console.log(
      `  Create one in Stripe Dashboard → Developers → Webhooks → ${expectedWebhookUrl}`
    );
    failed += 1;
  } else {
    for (const endpoint of matching) {
      const urlOk = endpoint.url === expectedWebhookUrl;
      console.log(
        `${urlOk ? "✓" : "⚠"} ${endpoint.url} (${endpoint.status})`
      );
      if (!urlOk && appUrl.includes("player-one-iq.vercel.app")) {
        console.log(`  Expected: ${expectedWebhookUrl}`);
      }
      const missingEvents = requiredEvents.filter(
        (event) => !endpoint.enabled_events.includes(event)
      );
      if (missingEvents.length > 0) {
        console.log(`  ✗ Missing events: ${missingEvents.join(", ")}`);
        failed += 1;
      } else {
        console.log("  ✓ Required subscription events enabled");
      }
    }
  }

  console.log("\nManual E2E test (production or local):");
  console.log("  1. Sign in as org owner → /billing");
  console.log("  2. Choose a paid plan (e.g. Creator Pro) → Stripe Checkout");
  console.log("  3. Pay with test card 4242 4242 4242 4242");
  console.log("  4. Return to /billing?checkout=success");
  console.log("  5. Confirm plan + features unlock; Stripe customer ID saved");
  console.log("  6. Use Manage billing → Customer Portal → cancel/downgrade");
  console.log("  7. Confirm webhook updates organization_subscriptions\n");

  console.log(
    failed === 0
      ? "Stripe billing configuration looks good.\n"
      : `${failed} issue(s) found.\n`
  );
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("✗", error.message);
  process.exit(1);
});
