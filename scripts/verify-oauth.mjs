#!/usr/bin/env node
/**
 * Platform OAuth readiness (v1: YouTube + Twitch).
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
    enabled: env.PLATFORM_OAUTH_ENABLED === "true",
    clientId: env.YOUTUBE_CLIENT_ID?.trim(),
    clientSecret: env.YOUTUBE_CLIENT_SECRET?.trim(),
    callback: `${appUrl}/api/platform-oauth/youtube/callback`,
  },
  {
    name: "Twitch",
    enabled: env.PLATFORM_OAUTH_ENABLED === "true",
    clientId: env.TWITCH_CLIENT_ID?.trim(),
    clientSecret: env.TWITCH_CLIENT_SECRET?.trim(),
    callback: `${appUrl}/api/platform-oauth/twitch/callback`,
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

  console.log("\nLaunch platforms:\n");
  for (const platform of launchPlatforms) {
    const creds = platform.clientId && platform.clientSecret;
    if (creds) {
      console.log(`✓ ${platform.name} credentials`);
    } else {
      console.log(`✗ ${platform.name} credentials incomplete`);
      failed += 1;
    }
    console.log(`  Register redirect: ${platform.callback}`);
  }

  console.log("\nManual E2E test:");
  console.log("  1. Creators → open a creator → Connect YouTube or Twitch");
  console.log("  2. Complete OAuth → confirm account shows connected");
  console.log("  3. Verify revenue/profile sync (or wait for 06:00 UTC cron)");
  console.log(
    `  4. Cron test: curl -H "Authorization: Bearer $CRON_SECRET" ${appUrl}/api/cron/sync-platform-revenue\n`
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
