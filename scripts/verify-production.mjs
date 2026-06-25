#!/usr/bin/env node
/**
 * Mirrors Settings → Deploy checklist (required items).
 * Usage: node scripts/verify-production.mjs [baseUrl]
 */

import {
  checklistItemsFromHealth,
  PUBLIC_ROUTE_CHECKS,
} from "./deploy-checklist-items.mjs";

const baseUrl = (
  process.argv[2] ??
  process.env.PRODUCTION_APP_URL ??
  "https://player-one-iq.vercel.app"
).replace(/\/$/, "");

async function checkPublicRoutes() {
  const results = [];
  for (const { path, label } of PUBLIC_ROUTE_CHECKS) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        redirect: "follow",
      });
      results.push({ label, done: response.ok });
    } catch {
      results.push({ label, done: false });
    }
  }
  return results;
}

async function checkApiV1Reachable() {
  try {
    const response = await fetch(`${baseUrl}/api/v1/creators`);
    return response.status === 401;
  } catch {
    return false;
  }
}

async function main() {
  console.log(`\nPlayer One IQ — deploy checklist (production)\n${baseUrl}\n`);

  const response = await fetch(`${baseUrl}/api/health`);
  if (!response.ok) {
    console.error(`✗ Health request failed (${response.status})`);
    process.exit(1);
  }

  const health = await response.json();
  const apiReachable = await checkApiV1Reachable();
  const apiAuthReady =
    health.apiV1AuthReady ?? health.serviceRoleConfigured ?? false;
  const items = checklistItemsFromHealth({
    ...health,
    apiV1AuthReady: apiAuthReady && apiReachable,
  });
  const routeChecks = await checkPublicRoutes();
  const allItems = [...items, ...routeChecks];
  const required = allItems.filter((item) => !item.optional);
  let failed = 0;

  for (const item of allItems) {
    const prefix = item.done ? "✓" : item.optional ? "○" : "✗";
    const suffix = item.optional && !item.done ? " (optional, skipped)" : "";
    console.log(`${prefix} ${item.label}${suffix}`);
    if (!item.optional && !item.done) failed += 1;
  }

  const readyCount = required.filter((item) => item.done).length;
  console.log(
    `\n${readyCount} of ${required.length} required checks passing.`
  );

  if (health.appUrl && !health.appUrl.includes("localhost")) {
    console.log("\nOAuth callback URLs (v1):");
    console.log(`  ${health.appUrl}/api/platform-oauth/youtube/callback`);
    console.log(`  ${health.appUrl}/api/platform-oauth/twitch/callback`);
    console.log("\nAgency Pro API base:");
    console.log(`  ${health.appUrl}/api/v1/creators`);
    console.log("\nStripe webhook:");
    console.log(`  ${health.appUrl}/api/billing/webhook`);
  }

  console.log(
    "\nManual before go-live: Supabase auth URLs, Resend domain, Stripe live keys, Agency Pro plan for API customers, webhook endpoints in Settings.\n"
  );

  console.log(failed === 0 ? "Deploy checklist passed.\n" : "\n");
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("✗", error.message);
  process.exit(1);
});
