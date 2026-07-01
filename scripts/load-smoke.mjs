#!/usr/bin/env node
/**
 * Lightweight capacity smoke test — concurrent public + API requests.
 *
 * Usage:
 *   node scripts/load-smoke.mjs [baseUrl]
 *   npm run verify:capacity
 *
 * Env (optional):
 *   LOAD_SMOKE_CONCURRENCY=25
 *   LOAD_SMOKE_ROUNDS=4
 *   LOAD_SMOKE_P95_MAX_MS=8000
 *   LOAD_SMOKE_ERROR_RATE_MAX=0.02
 */

import { PUBLIC_ROUTE_CHECKS } from "./deploy-checklist-items.mjs";

const baseUrl = (
  process.argv[2] ??
  process.env.LOAD_SMOKE_URL ??
  process.env.PRODUCTION_APP_URL ??
  "https://player-one-iq.vercel.app"
).replace(/\/$/, "");

const concurrency = Math.max(
  1,
  Number.parseInt(process.env.LOAD_SMOKE_CONCURRENCY ?? "25", 10)
);
const rounds = Math.max(
  1,
  Number.parseInt(process.env.LOAD_SMOKE_ROUNDS ?? "4", 10)
);
const p95MaxMs = Math.max(
  500,
  Number.parseInt(process.env.LOAD_SMOKE_P95_MAX_MS ?? "8000", 10)
);
const errorRateMax = Math.min(
  1,
  Math.max(0, Number.parseFloat(process.env.LOAD_SMOKE_ERROR_RATE_MAX ?? "0.02"))
);

const ENDPOINTS = [
  { path: "/api/health", label: "Health API", expectStatus: 200 },
  { path: "/api/v1/creators", label: "API v1 auth gate", expectStatus: 401 },
  ...PUBLIC_ROUTE_CHECKS.map(({ path, label }) => ({
    path,
    label,
    expectStatus: 200,
  })),
];

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)
  );
  return sorted[index];
}

function summarizeLatencies(samples) {
  if (samples.length === 0) {
    return { min: 0, max: 0, p50: 0, p95: 0, avg: 0 };
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const total = samples.reduce((sum, value) => sum + value, 0);
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    avg: total / samples.length,
  };
}

async function fetchEndpoint(endpoint) {
  const started = performance.now();
  try {
    const response = await fetch(`${baseUrl}${endpoint.path}`, {
      redirect: "follow",
      headers: { Accept: "*/*" },
    });
    const ms = performance.now() - started;
    const ok = response.status === endpoint.expectStatus;
    return {
      ok,
      ms,
      path: endpoint.path,
      status: response.status,
      expected: endpoint.expectStatus,
    };
  } catch (error) {
    return {
      ok: false,
      ms: performance.now() - started,
      path: endpoint.path,
      status: 0,
      expected: endpoint.expectStatus,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runLoad(totalRequests) {
  const results = [];
  let cursor = 0;

  async function worker() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= totalRequests) break;
      const endpoint = ENDPOINTS[index % ENDPOINTS.length];
      results.push(await fetchEndpoint(endpoint));
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, totalRequests) }, () => worker())
  );

  return results;
}

function formatMs(value) {
  return `${Math.round(value)}ms`;
}

async function main() {
  const totalRequests = concurrency * rounds;

  console.log(`\nPlayer One IQ — capacity smoke test\n${baseUrl}\n`);
  console.log(
    `Concurrency: ${concurrency} · rounds: ${rounds} · total requests: ${totalRequests}`
  );
  console.log(
    `Thresholds: p95 ≤ ${p95MaxMs}ms · error rate ≤ ${(errorRateMax * 100).toFixed(1)}%\n`
  );

  const probe = await fetchEndpoint(ENDPOINTS[0]);
  if (!probe.ok) {
    console.error(
      `✗ Preflight failed for ${ENDPOINTS[0].path} (status ${probe.status}, expected ${probe.expected})`
    );
    if (probe.error) console.error(`  ${probe.error}`);
    process.exit(1);
  }

  const started = performance.now();
  const results = await runLoad(totalRequests);
  const elapsed = performance.now() - started;

  const failures = results.filter((result) => !result.ok);
  const errorRate = failures.length / results.length;
  const latency = summarizeLatencies(results.map((result) => result.ms));
  const byPath = new Map();

  for (const result of results) {
    const bucket = byPath.get(result.path) ?? {
      path: result.path,
      total: 0,
      failed: 0,
      latencies: [],
    };
    bucket.total += 1;
    if (!result.ok) bucket.failed += 1;
    bucket.latencies.push(result.ms);
    byPath.set(result.path, bucket);
  }

  console.log("── Summary ──\n");
  console.log(`Requests: ${results.length}`);
  console.log(`Elapsed: ${formatMs(elapsed)}`);
  console.log(`Throughput: ${(results.length / (elapsed / 1000)).toFixed(1)} req/s`);
  console.log(`Failures: ${failures.length} (${(errorRate * 100).toFixed(1)}%)`);
  console.log(
    `Latency: min ${formatMs(latency.min)} · p50 ${formatMs(latency.p50)} · p95 ${formatMs(latency.p95)} · max ${formatMs(latency.max)}`
  );

  console.log("\n── By endpoint ──\n");
  for (const bucket of byPath.values()) {
    const stats = summarizeLatencies(bucket.latencies);
    const failPct = ((bucket.failed / bucket.total) * 100).toFixed(0);
    console.log(
      `${bucket.failed > 0 ? "✗" : "✓"} ${bucket.path} — ${bucket.total} reqs, ${failPct}% fail, p95 ${formatMs(stats.p95)}`
    );
  }

  if (failures.length > 0) {
    console.log("\n── Sample failures ──\n");
    for (const failure of failures.slice(0, 5)) {
      const detail = failure.error
        ? failure.error
        : `status ${failure.status}, expected ${failure.expected}`;
      console.log(`✗ ${failure.path}: ${detail}`);
    }
  }

  const p95Ok = latency.p95 <= p95MaxMs;
  const errorOk = errorRate <= errorRateMax;

  console.log("\n── Thresholds ──\n");
  console.log(`${p95Ok ? "✓" : "✗"} p95 ${formatMs(latency.p95)} (max ${p95MaxMs}ms)`);
  console.log(
    `${errorOk ? "✓" : "✗"} error rate ${(errorRate * 100).toFixed(1)}% (max ${(errorRateMax * 100).toFixed(1)}%)`
  );

  if (p95Ok && errorOk) {
    console.log("\nCapacity smoke test passed.\n");
    console.log(
      "Tip: run against staging before big launches; raise LOAD_SMOKE_CONCURRENCY for heavier probes.\n"
    );
    process.exit(0);
  }

  console.log("\nCapacity smoke test failed.\n");
  console.log(
    "If this was a cold-start spike, retry once or set LOAD_SMOKE_P95_MAX_MS higher for the first deploy.\n"
  );
  process.exit(1);
}

main().catch((error) => {
  console.error("✗", error.message);
  process.exit(1);
});
