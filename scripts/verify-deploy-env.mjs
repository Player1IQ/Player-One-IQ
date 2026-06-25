#!/usr/bin/env node
/**
 * Pre-deploy environment check for Vercel.
 * Usage: node scripts/verify-deploy-env.mjs
 * Loads .env.local when present (does not print secret values).
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

const checks = [
  {
    key: "NEXT_PUBLIC_SUPABASE_URL",
    required: true,
    hint: "Supabase → Settings → API",
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    required: true,
    hint: "Supabase → Settings → API",
  },
  {
    key: "NEXT_PUBLIC_APP_URL",
    required: true,
    hint: "https://your-app.vercel.app (no trailing slash)",
  },
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    required: true,
    hint: "Required for daily OAuth revenue cron",
  },
  {
    key: "CRON_SECRET",
    required: true,
    hint: "Vercel sends this as Authorization Bearer on cron hits",
  },
  {
    key: "PLATFORM_OAUTH_STATE_SECRET",
    required: true,
    hint: "Long random string for OAuth state signing",
  },
  {
    key: "RESEND_API_KEY",
    required: false,
    hint: "Team invite emails",
  },
  {
    key: "INVITE_EMAIL_FROM",
    required: false,
    hint: "Verified sender in Resend",
  },
  {
    key: "PLATFORM_OAUTH_ENABLED",
    required: false,
    hint: 'Set to "true" when OAuth credentials are ready',
  },
  {
    key: "YOUTUBE_CLIENT_ID",
    required: false,
    hint: "YouTube OAuth",
  },
  {
    key: "YOUTUBE_CLIENT_SECRET",
    required: false,
    hint: "YouTube OAuth",
  },
  {
    key: "TWITCH_CLIENT_ID",
    required: false,
    hint: "Twitch OAuth",
  },
  {
    key: "TWITCH_CLIENT_SECRET",
    required: false,
    hint: "Twitch OAuth",
  },
  {
    key: "AI_CREDENTIALS_ENCRYPTION_KEY",
    required: false,
    hint: "Required for workspace BYOK keys in Settings → AI integration",
  },
  {
    key: "OPENAI_API_KEY",
    required: false,
    hint: "Optional platform AI fallback (workspaces can use BYOK instead)",
  },
  {
    key: "STRIPE_SECRET_KEY",
    required: false,
    hint: "Stripe billing checkout",
  },
  {
    key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    required: false,
    hint: "Stripe billing checkout",
  },
  {
    key: "STRIPE_WEBHOOK_SECRET",
    required: false,
    hint: "Stripe subscription sync webhook",
  },
  {
    key: "API_KEY_PEPPER",
    required: false,
    hint: "Optional extra secret for Agency Pro API key hashing",
  },
];

let failed = 0;
let warned = 0;

console.log("\nPlayer One IQ — deploy environment check\n");

for (const { key, required, hint } of checks) {
  const value = env[key];
  const set = Boolean(value && value.trim());
  if (required && !set) {
    console.log(`✗ ${key} — MISSING (${hint})`);
    failed += 1;
  } else if (!required && !set) {
    console.log(`○ ${key} — optional, not set (${hint})`);
    warned += 1;
  } else {
    console.log(`✓ ${key}`);
  }
}

const appUrl = env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
if (appUrl?.includes("localhost")) {
  console.log(
    "\n⚠ NEXT_PUBLIC_APP_URL still points to localhost — use your Vercel URL in production."
  );
  warned += 1;
}

if (appUrl && !appUrl.includes("localhost")) {
  console.log("\nProduction OAuth redirect URIs to register (v1 launch):\n");
  for (const platform of ["youtube", "twitch"]) {
    console.log(`  ${appUrl}/api/platform-oauth/${platform}/callback`);
  }
  console.log("\nSupabase → Authentication → URL configuration:");
  console.log(`  Site URL: ${appUrl}`);
  console.log(`  Redirect URLs: ${appUrl}/auth/callback`);
}

const aiEncryption = Boolean(env.AI_CREDENTIALS_ENCRYPTION_KEY?.trim());
const openAi = Boolean(env.OPENAI_API_KEY?.trim());
if (!aiEncryption && !openAi) {
  console.log(
    "\n⚠ AI: set AI_CREDENTIALS_ENCRYPTION_KEY for workspace BYOK, and/or OPENAI_API_KEY as platform fallback."
  );
  warned += 1;
} else if (aiEncryption && !openAi) {
  console.log(
    "\n✓ AI: BYOK encryption configured — workspaces connect keys in Settings."
  );
}

console.log(
  `\n${failed === 0 ? "Ready for deploy" : `${failed} required variable(s) missing`}.\n`
);

process.exit(failed > 0 ? 1 : 0);
