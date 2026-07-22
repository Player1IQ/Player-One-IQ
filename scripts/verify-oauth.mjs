#!/usr/bin/env node
/**
 * Platform OAuth readiness (YouTube, Twitch, Instagram, TikTok).
 * Usage: node scripts/verify-oauth.mjs [appUrl]
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

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

const launchPlatforms = [
  {
    name: "YouTube",
    required: true,
    clientId: env.YOUTUBE_CLIENT_ID?.trim(),
    clientSecret: env.YOUTUBE_CLIENT_SECRET?.trim(),
    callback: `${appUrl}/api/platform-oauth/youtube/callback`,
  },
  {
    name: "Twitch",
    required: true,
    clientId: env.TWITCH_CLIENT_ID?.trim(),
    clientSecret: env.TWITCH_CLIENT_SECRET?.trim(),
    callback: `${appUrl}/api/platform-oauth/twitch/callback`,
  },
  {
    name: "Instagram (Meta)",
    required: false,
    clientId: env.INSTAGRAM_CLIENT_ID?.trim(),
    clientSecret: env.INSTAGRAM_CLIENT_SECRET?.trim(),
    callback: `${appUrl}/api/platform-oauth/instagram/callback`,
  },
  {
    name: "TikTok",
    required: false,
    clientId: env.TIKTOK_CLIENT_KEY?.trim(),
    clientSecret: env.TIKTOK_CLIENT_SECRET?.trim(),
    callback: `${appUrl}/api/platform-oauth/tiktok/callback`,
  },
];

async function main() {
  console.log("\nPlayer One IQ — platform OAuth check (v1)\n");
  console.log(`App URL: ${appUrl}\n`);

  let failed = 0;

  if (env.PLATFORM_OAUTH_ENABLED !== "true") {
    console.log("✗ PLATFORM_OAUTH_ENABLED — set to true for launch");
    failed += 1;
  } else {
    console.log("✓ PLATFORM_OAUTH_ENABLED");
  }

  if (!env.PLATFORM_OAUTH_STATE_SECRET?.trim()) {
    console.log("✗ PLATFORM_OAUTH_STATE_SECRET — MISSING");
    failed += 1;
  } else {
    console.log("✓ PLATFORM_OAUTH_STATE_SECRET");
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    console.log("✗ SUPABASE_SERVICE_ROLE_KEY — required for revenue sync cron");
    failed += 1;
  } else {
    console.log("✓ SUPABASE_SERVICE_ROLE_KEY");
  }

  if (!env.CRON_SECRET?.trim()) {
    console.log("✗ CRON_SECRET — required for daily revenue sync");
    failed += 1;
  } else {
    console.log("✓ CRON_SECRET");
  }

  console.log("\nPlatforms:\n");
  for (const platform of launchPlatforms) {
    const creds = platform.clientId && platform.clientSecret;
    if (creds) {
      console.log(`✓ ${platform.name} credentials`);
    } else if (platform.required) {
      console.log(`✗ ${platform.name} credentials incomplete`);
      failed += 1;
    } else {
      console.log(`○ ${platform.name} credentials not set (optional)`);
    }
    console.log(`  Register redirect: ${platform.callback}`);
  }

  console.log("\nGoogle / YouTube beta note:");
  console.log(
    "  OAuth consent screen must be in Testing until verified. Add each beta tester Gmail under"
  );
  console.log("  Google Cloud → APIs & Services → OAuth consent screen → Test users.");
  console.log(
    "  Use the same OAuth client as YOUTUBE_CLIENT_ID. Redirect URI must match exactly.\n"
  );

  console.log("\nTikTok beta note:");
  console.log(
    "  TikTok for Developers → Login Kit → add redirect URI exactly as shown above."
  );
  console.log(
    "  Add beta TikTok accounts as test users if the app is still in sandbox.\n"
  );

  console.log("\nManual E2E test:");
  console.log("  1. Creators → open a creator → Connect YouTube / Twitch / Instagram");
  console.log("  2. Complete OAuth → confirm account shows connected");
  console.log("  3. Instagram requires a Business or Creator Instagram account");
  console.log("  4. Verify revenue/profile sync (or wait for 06:00 UTC cron)");
  console.log(
    `  5. Cron test: curl -H "Authorization: Bearer $CRON_SECRET" ${appUrl}/api/cron/sync-platform-revenue\n`
  );

  console.log(
    failed === 0
      ? "Platform OAuth configuration looks good.\n"
      : `${failed} issue(s) found.\n`
  );
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("✗", error.message);
  process.exit(1);
});
