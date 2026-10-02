#!/usr/bin/env node
/**
 * Create unpaid Checkout sessions and assert line amounts match catalog.
 * Uses test-mode STRIPE_SECRET_KEY from .env.local. Does not complete payment.
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

const EXPECTED = [
  { code: "creator_pro", interval: "month", priceId: "price_1ThuXdHRtLHXdGBBFA4vL7i5", cents: 2900 },
  { code: "creator_pro", interval: "year", priceId: "price_1UM8VAHRtLHXdGBBK34Cylt7", cents: 27800 },
  { code: "agency", interval: "month", priceId: "price_1ThuWNHRtLHXdGBBlsPAm8aD", cents: 9900 },
  { code: "agency", interval: "year", priceId: "price_1UM8VAHRtLHXdGBB5IpWvrU9", cents: 95000 },
  { code: "agency_pro", interval: "month", priceId: "price_1ThuaGHRtLHXdGBBKUP8b4Hj", cents: 24900 },
  { code: "agency_pro", interval: "year", priceId: "price_1UM8VAHRtLHXdGBBdk88Ylfs", cents: 239000 },
  { code: "sponsor_pro", interval: "month", priceId: "price_1ThubXHRtLHXdGBBWKYsvvt5", cents: 19900 },
  { code: "sponsor_pro", interval: "year", priceId: "price_1UM8VAHRtLHXdGBBNbQpuP7K", cents: 191000 },
];

async function main() {
  const secretKey = env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    console.error("Missing STRIPE_SECRET_KEY");
    process.exit(1);
  }
  const stripe = new Stripe(secretKey);
  let failed = 0;

  for (const row of EXPECTED) {
    const price = await stripe.prices.retrieve(row.priceId);
    const priceOk = price.unit_amount === row.cents && price.active;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: row.priceId, quantity: 1 }],
      success_url: "https://www.playeroneiq.com/billing?checkout=success",
      cancel_url: "https://www.playeroneiq.com/billing?checkout=canceled",
      metadata: { plan_code: row.code, billing_interval: row.interval === "year" ? "yearly" : "monthly" },
    });
    const sessionOk = session.amount_total === row.cents;
    const mark = priceOk && sessionOk ? "✓" : "✗";
    if (!priceOk || !sessionOk) failed += 1;
    console.log(
      `${mark} ${row.code} ${row.interval}: price=${price.unit_amount} active=${price.active} checkout=${session.amount_total} expected=${row.cents}`
    );
    if (session.id) {
      await stripe.checkout.sessions.expire(session.id).catch(() => {});
    }
  }

  if (failed) {
    console.error(`\n${failed} mismatch(es)`);
    process.exit(1);
  }
  console.log("\nAll Checkout session amounts match the 20% annual catalog.");
}

main().catch((error) => {
  console.error("✗", error.message);
  process.exit(1);
});
