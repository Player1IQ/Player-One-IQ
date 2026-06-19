#!/usr/bin/env node
/**
 * Mirrors Settings → Deploy checklist (required items).
 * Usage: node scripts/verify-production.mjs [baseUrl]
 */

const baseUrl = (
  process.argv[2] ??
  process.env.PRODUCTION_APP_URL ??
  "https://player-one-iq.vercel.app"
).replace(/\/$/, "");

function checklistItems(health) {
  return [
    {
      label: "Supabase connected",
      done: health.supabase ?? false,
    },
    {
      label: "NEXT_PUBLIC_APP_URL (production URL)",
      done: Boolean(health.appUrl && !health.appUrl.includes("localhost")),
    },
    {
      label: "Cron secret (daily revenue sync)",
      done: health.cronConfigured ?? false,
    },
    {
      label: "Service role key (scheduled sync)",
      done: health.serviceRoleConfigured ?? false,
    },
    {
      label: "Platform OAuth enabled",
      done: health.platformOAuth ?? false,
    },
    {
      label: `Launch OAuth platforms (${health.launchOAuthPlatforms?.join(", ") ?? "YouTube, Twitch"})`,
      done: health.platformOAuth ?? false,
    },
    {
      label: "Stripe billing keys",
      done: health.stripeConfigured ?? false,
    },
    {
      label: "Stripe webhook secret",
      done: health.stripeWebhookConfigured ?? false,
    },
    {
      label: "Team invite email (Resend)",
      done: health.resendConfigured ?? false,
    },
    {
      label: "AI key encryption (AI_CREDENTIALS_ENCRYPTION_KEY)",
      done: health.aiCredentialsEncryptionConfigured ?? false,
    },
    {
      label: "Live AI ready (BYOK or platform fallback)",
      done: health.aiDeployReady ?? false,
    },
    {
      label: "Platform OpenAI fallback (optional)",
      done: health.openAiConfigured ?? false,
      optional: !health.openAiConfigured,
    },
    {
      label: "Platform OpenAI billing active",
      done:
        !health.openAiConfigured || health.openAiHealth === "available",
      optional: !health.openAiConfigured,
    },
  ];
}

const ROUTE_CHECKS = [
  { path: "/login", label: "Login page reachable" },
  { path: "/signup", label: "Signup page reachable" },
  { path: "/terms", label: "Terms page reachable" },
  { path: "/privacy", label: "Privacy page reachable" },
  { path: "/robots.txt", label: "robots.txt served" },
  { path: "/sitemap.xml", label: "sitemap.xml served" },
];

async function checkPublicRoutes() {
  const results = [];
  for (const { path, label } of ROUTE_CHECKS) {
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

async function main() {
  console.log(`\nPlayer One IQ — deploy checklist (production)\n${baseUrl}\n`);

  const response = await fetch(`${baseUrl}/api/health`);
  if (!response.ok) {
    console.error(`✗ Health request failed (${response.status})`);
    process.exit(1);
  }

  const health = await response.json();
  const items = checklistItems(health);
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
  }

  console.log(failed === 0 ? "\nDeploy checklist passed.\n" : "\n");
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("✗", error.message);
  process.exit(1);
});
