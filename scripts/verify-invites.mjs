#!/usr/bin/env node
/**
 * Team invite email readiness (Resend).
 * Usage: node scripts/verify-invites.mjs [appUrl]
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

function senderDomain(from) {
  const match = from.match(/<([^>]+)>/) ?? from.match(/@([^\s>]+)/);
  if (!match) return null;
  const email = match[1].includes("@") ? match[1] : `x@${match[1]}`;
  return email.split("@")[1]?.toLowerCase() ?? null;
}

async function main() {
  console.log("\nPlayer One IQ — team invite email check\n");
  console.log(`Invite links will use: ${appUrl}/invite/{token}\n`);

  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.INVITE_EMAIL_FROM?.trim();
  let failed = 0;
  let warned = 0;

  if (!apiKey) {
    console.log("✗ RESEND_API_KEY — MISSING");
    failed += 1;
  } else {
    console.log("✓ RESEND_API_KEY");
  }

  if (!from) {
    console.log("✗ INVITE_EMAIL_FROM — MISSING");
    failed += 1;
  } else {
    console.log(`✓ INVITE_EMAIL_FROM (${from.split("<")[0].trim() || "configured"})`);
    if (from.includes("onboarding@resend.dev")) {
      console.log(
        "⚠ Using Resend sandbox sender — verify a custom domain before public launch."
      );
      warned += 1;
    }
  }

  if (appUrl.includes("localhost")) {
    console.log("⚠ NEXT_PUBLIC_APP_URL is localhost — invite links won't work for recipients.");
    warned += 1;
  } else {
    console.log("✓ Production app URL for invite links");
  }

  if (!apiKey) {
    process.exit(1);
  }

  const domainsResponse = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!domainsResponse.ok) {
    console.log(`⚠ Could not list Resend domains (${domainsResponse.status})`);
    warned += 1;
  } else {
    const body = await domainsResponse.json();
    const domains = body.data ?? [];
    const domain = from ? senderDomain(from) : null;

    if (domains.length === 0) {
      console.log("⚠ No custom domains in Resend — sandbox sender only.");
      warned += 1;
    } else {
      console.log("\nResend domains:\n");
      for (const entry of domains) {
        const verified = entry.status === "verified";
        console.log(
          `${verified ? "✓" : "○"} ${entry.name} (${entry.status ?? "unknown"})`
        );
        if (domain && entry.name === domain && !verified) {
          console.log(`  ✗ Sender domain ${domain} is not verified yet`);
          failed += 1;
        }
      }
      if (domain && !domains.some((d) => d.name === domain)) {
        if (domain === "resend.dev") {
          console.log("\n○ Sender uses resend.dev (testing only)");
        } else {
          console.log(`\n⚠ Sender domain ${domain} not found in Resend account`);
          warned += 1;
        }
      }
    }
  }

  console.log("\nManual E2E test:");
  console.log("  1. Team → Invite member (use an email you can access)");
  console.log("  2. Open invite email → Accept invitation");
  console.log("  3. Sign in with invited email → confirm role + org access");
  console.log("  4. Optional: npx tsx scripts/test-invite-email.ts you@email.com\n");

  console.log(
    failed === 0
      ? warned === 0
        ? "Invite email configuration looks good.\n"
        : `Invite email configured with ${warned} warning(s).\n`
      : `${failed} issue(s) found.\n`
  );
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("✗", error.message);
  process.exit(1);
});
