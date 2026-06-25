#!/usr/bin/env node
/**
 * Agency Pro API smoke test (production or local).
 * Usage: node scripts/verify-api.mjs [baseUrl]
 *
 * Optional: POIQ_API_KEY=poiq_... for authenticated 200 check
 */

const baseUrl = (
  process.argv[2] ??
  process.env.PRODUCTION_APP_URL ??
  process.env.PLAYWRIGHT_BASE_URL ??
  "https://player-one-iq.vercel.app"
).replace(/\/$/, "");

async function expectUnauthorized(path, description) {
  const response = await fetch(`${baseUrl}${path}`);
  if (response.status === 307 || response.status === 308) {
    console.log(`✗ ${description} — got redirect (${response.status}), expected JSON 401`);
    return false;
  }
  if (response.status !== 401) {
    console.log(`✗ ${description} — expected 401, got ${response.status}`);
    return false;
  }
  let body;
  try {
    body = await response.json();
  } catch {
    console.log(`✗ ${description} — response is not JSON`);
    return false;
  }
  if (body.code !== "invalid_api_key") {
    console.log(
      `✗ ${description} — expected code invalid_api_key, got ${body.code ?? "none"}`
    );
    return false;
  }
  console.log(`✓ ${description}`);
  return true;
}

async function expectAuthenticated(path, description) {
  const apiKey = process.env.POIQ_API_KEY?.trim();
  if (!apiKey) {
    console.log(`○ ${description} — skipped (set POIQ_API_KEY to test)`);
    return true;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (response.status === 403) {
    console.log(
      `○ ${description} — 403 api_access_required (key valid but plan lacks api_access)`
    );
    return true;
  }

  if (!response.ok) {
    console.log(`✗ ${description} — expected 200, got ${response.status}`);
    return false;
  }

  const body = await response.json();
  if (!body.data || !body.meta?.organization_id) {
    console.log(`✗ ${description} — unexpected response shape`);
    return false;
  }

  console.log(`✓ ${description}`);
  return true;
}

async function main() {
  console.log(`\nPlayer One IQ — Agency Pro API check\n${baseUrl}\n`);

  let failed = 0;

  const healthRes = await fetch(`${baseUrl}/api/health`);
  if (!healthRes.ok) {
    console.error(`✗ Health request failed (${healthRes.status})`);
    process.exit(1);
  }

  const health = await healthRes.json();
  const apiAuthReady =
    health.apiV1AuthReady ?? health.serviceRoleConfigured ?? false;

  if (!health.serviceRoleConfigured) {
    console.log("✗ Service role key — MISSING (required for API key auth)");
    failed += 1;
  } else {
    console.log("✓ Service role key configured");
  }

  if (!apiAuthReady) {
    console.log("✗ API v1 auth not ready (needs service role on server)");
    failed += 1;
  } else {
    console.log("✓ API v1 auth ready");
  }

  const checks = [
    expectUnauthorized("/api/v1/creators", "GET /api/v1/creators rejects missing key"),
    expectUnauthorized(
      "/api/v1/contracts",
      "GET /api/v1/contracts rejects missing key"
    ),
    expectAuthenticated(
      "/api/v1/creators",
      "GET /api/v1/creators with POIQ_API_KEY"
    ),
  ];

  for (const check of checks) {
    const ok = await check;
    if (!ok) failed += 1;
  }

  console.log(
    failed === 0
      ? "\nAPI checks passed.\n"
      : `\n${failed} API check(s) failed.\n`
  );
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("✗", error.message);
  process.exit(1);
});
