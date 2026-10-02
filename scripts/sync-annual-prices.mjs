#!/usr/bin/env node
/**
 * Audit Stripe products/prices and optionally create true 20% annual prices.
 *
 * Usage:
 *   node scripts/sync-annual-prices.mjs              # audit only
 *   node scripts/sync-annual-prices.mjs --apply       # create + archive
 *
 * Reads STRIPE_SECRET_KEY from .env.local (or STRIPE_LIVE_SECRET_KEY if set).
 * Never prints secret values.
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
const apply = process.argv.includes("--apply");

const TARGETS = [
  {
    code: "creator_pro",
    productMatchers: ["creator pro"],
    monthlyCents: 2900,
    yearlyCents: 27800,
    nickname: "Creator Pro yearly (20% off)",
  },
  {
    code: "agency",
    productMatchers: ["agency"],
    excludeMatchers: ["agency pro"],
    monthlyCents: 9900,
    yearlyCents: 95000,
    nickname: "Agency yearly (20% off)",
  },
  {
    code: "agency_pro",
    productMatchers: ["agency pro"],
    monthlyCents: 24900,
    yearlyCents: 239000,
    nickname: "Agency Pro yearly (20% off)",
  },
  {
    code: "sponsor_pro",
    productMatchers: ["sponsor pro", "sponsor"],
    monthlyCents: 19900,
    yearlyCents: 191000,
    nickname: "Sponsor Pro yearly (20% off)",
  },
];

function dollars(cents) {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function matchesProduct(name, target) {
  const lower = name.toLowerCase();
  if (target.excludeMatchers?.some((m) => lower === m || lower.includes(m))) {
    return false;
  }
  return target.productMatchers.some((m) => lower === m);
}

async function main() {
  const secretKey = (
    env.STRIPE_LIVE_SECRET_KEY ||
    env.STRIPE_SECRET_KEY ||
    ""
  ).trim();
  if (!secretKey) {
    console.error("Missing STRIPE_SECRET_KEY");
    process.exit(1);
  }

  const mode = secretKey.startsWith("sk_live_")
    ? "live"
    : secretKey.startsWith("sk_test_")
      ? "test"
      : "unknown";
  console.log(`Stripe mode: ${mode}`);
  console.log(apply ? "Mode: APPLY (create + archive)\n" : "Mode: AUDIT (no writes)\n");

  const stripe = new Stripe(secretKey);
  const products = await stripe.products.list({ limit: 100, active: true });
  const prices = await stripe.prices.list({ limit: 100, active: true, expand: ["data.product"] });

  console.log("Products:");
  for (const product of products.data) {
    console.log(
      `  - ${product.name} (${product.id}) default=${product.default_price ?? "none"}`
    );
  }

  console.log("\nActive prices:");
  for (const price of prices.data) {
    const productName =
      typeof price.product === "string" ? price.product : price.product.name;
    const amount = price.unit_amount != null ? dollars(price.unit_amount) : "custom";
    console.log(
      `  - ${productName} ${price.id} ${amount}/${price.recurring?.interval ?? "once"} lookup=${price.lookup_key ?? "-"}`
    );
  }

  const paidProductNames = products.data.map((p) => p.name);
  const hasBaseCreator = paidProductNames.some((n) => /^creator$/i.test(n));
  const hasBaseSponsor = paidProductNames.some((n) => /^sponsor$/i.test(n));
  console.log("\nNon-Pro product check:");
  console.log(`  Stripe product named exactly "Creator": ${hasBaseCreator ? "YES" : "NO"}`);
  console.log(`  Stripe product named exactly "Sponsor": ${hasBaseSponsor ? "YES" : "NO"}`);

  const results = [];

  for (const target of TARGETS) {
    const product = products.data.find((p) => matchesProduct(p.name, target));
    if (!product) {
      console.log(`\n✗ No Stripe product for ${target.code}`);
      results.push({ code: target.code, error: "missing product" });
      continue;
    }

    const productPrices = prices.data.filter((p) => {
      const id = typeof p.product === "string" ? p.product : p.product.id;
      return id === product.id;
    });
    const monthly = productPrices.find(
      (p) => p.recurring?.interval === "month" && p.unit_amount === target.monthlyCents
    );
    const currentYearly = productPrices
      .filter((p) => p.recurring?.interval === "year")
      .sort((a, b) => (b.created ?? 0) - (a.created ?? 0));
    const existingCorrect = currentYearly.find(
      (p) => p.unit_amount === target.yearlyCents
    );
    const oldYearly = currentYearly.filter((p) => p.unit_amount !== target.yearlyCents);

    console.log(`\n${target.code} → product ${product.id} (${product.name})`);
    console.log(
      `  monthly: ${monthly ? `${monthly.id} ${dollars(monthly.unit_amount ?? 0)}` : "NOT FOUND at expected amount"}`
    );
    console.log(
      `  yearly now: ${
        currentYearly.length
          ? currentYearly
              .map((p) => `${p.id} ${dollars(p.unit_amount ?? 0)}`)
              .join(", ")
          : "none"
      }`
    );
    console.log(`  yearly target: ${dollars(target.yearlyCents)}`);

    let newYearlyId = existingCorrect?.id ?? null;
    if (apply && !newYearlyId) {
      const created = await stripe.prices.create({
        product: product.id,
        currency: "usd",
        unit_amount: target.yearlyCents,
        recurring: { interval: "year" },
        nickname: target.nickname,
        metadata: {
          plan_code: target.code,
          billing_interval: "yearly",
          discount: "20_percent",
        },
      });
      newYearlyId = created.id;
      console.log(`  created yearly ${created.id}`);

      if (
        typeof product.default_price === "string" &&
        oldYearly.some((p) => p.id === product.default_price)
      ) {
        await stripe.products.update(product.id, { default_price: created.id });
        console.log(`  set product default_price to new yearly`);
      }
    }

    if (apply) {
      for (const old of oldYearly) {
        await stripe.prices.update(old.id, { active: false });
        console.log(`  archived old yearly ${old.id} (${dollars(old.unit_amount ?? 0)})`);
      }
    }

    results.push({
      code: target.code,
      productId: product.id,
      productName: product.name,
      monthlyPriceId: monthly?.id ?? null,
      oldYearlyPriceIds: oldYearly.map((p) => p.id),
      newYearlyPriceId: newYearlyId,
      yearlyCents: target.yearlyCents,
    });
  }

  console.log("\nJSON_RESULT");
  console.log(JSON.stringify({ mode, apply, results }, null, 2));
}

main().catch((error) => {
  console.error("✗", error.message);
  process.exit(1);
});
