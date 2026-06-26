#!/usr/bin/env node
/**
 * Schedule unit tests (helpers + cancellation email copy).
 * Usage: node scripts/verify-schedule.mjs
 */

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const nodeCmd = process.platform === "win32" ? "node.exe" : "node";

const scheduleTests = [
  "tests/schedule/helpers.test.ts",
  "tests/schedule/cancellation-email.test.ts",
];

console.log("\n── Schedule unit tests ──\n");

const result = spawnSync(
  nodeCmd,
  ["--import", "tsx", "--test", ...scheduleTests],
  {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(
  "\nFor full schedule flows (create, update, delete), run:\n  npm run test:e2e -- e2e/schedule.spec.ts\n"
);
