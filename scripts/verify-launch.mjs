#!/usr/bin/env node
/**
 * Pre-launch checklist — runs all verify scripts in order.
 * Usage: node scripts/verify-launch.mjs [productionUrl]
 *
 * Local env: verify:deploy, verify:billing, verify:invites, verify:oauth
 * Production: verify:production against live URL
 */

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const baseUrl = (
  process.argv[2] ??
  process.env.PRODUCTION_APP_URL ??
  "https://player-one-iq.vercel.app"
).replace(/\/$/, "");

const root = resolve(process.cwd());
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

const STEPS = [
  { name: "Deploy env", script: "verify:deploy" },
  { name: "Billing", script: "verify:billing", args: [baseUrl] },
  { name: "Team invites", script: "verify:invites", args: [baseUrl] },
  { name: "Platform OAuth", script: "verify:oauth", args: [baseUrl] },
  { name: "Agency Pro API", script: "verify:api", args: [baseUrl] },
  { name: "Production smoke", script: "verify:production", args: [baseUrl] },
];

function runStep({ name, script, args = [] }) {
  console.log(`\n── ${name} (${script}) ──\n`);
  const result = spawnSync(npmCmd, ["run", script, "--", ...args], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  return result.status === 0;
}

function main() {
  console.log(`\nPlayer One IQ — launch checklist\nProduction URL: ${baseUrl}\n`);

  const results = STEPS.map((step) => ({
    name: step.name,
    passed: runStep(step),
  }));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  console.log("\n── Summary ──\n");
  for (const { name, passed: ok } of results) {
    console.log(`${ok ? "✓" : "✗"} ${name}`);
  }

  console.log(`\n${passed} of ${results.length} launch checks passing.\n`);

  if (failed.length > 0) {
    console.log(
      "Manual steps (not automated): Resend domain, Stripe live keys, Supabase auth URLs, OAuth prod callbacks, Agency Pro API keys + webhooks in Settings, agency billing policy.\n"
    );
    process.exit(1);
  }

  console.log(
    "All automated checks passed. Complete manual ops (Resend domain, Stripe live, Supabase auth URLs, OAuth callbacks) before inviting users.\n"
  );
}

main();
