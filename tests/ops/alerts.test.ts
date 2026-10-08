import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evaluateHealthUptimeCheck,
  opsAlertFingerprint,
  resolveOpsAlertIngestUrl,
  shouldSendOpsAlert,
} from "@/lib/ops/alerts-config";
import { shouldAlertOAuthFailure } from "@/lib/platform-oauth/oauth-errors";

describe("opsAlertFingerprint", () => {
  it("normalizes kind and title", () => {
    assert.equal(
      opsAlertFingerprint("cron", "  Cron failed: Uptime  "),
      "cron:cron failed: uptime"
    );
  });
});

describe("shouldSendOpsAlert", () => {
  it("sends when nothing has been emailed yet", () => {
    assert.equal(shouldSendOpsAlert(null, Date.now(), 1_000), true);
  });

  it("holds repeats inside the cooldown window", () => {
    const now = Date.parse("2026-10-07T21:00:00.000Z");
    assert.equal(
      shouldSendOpsAlert("2026-10-07T20:45:00.000Z", now, 30 * 60 * 1000),
      false
    );
  });

  it("sends again after the cooldown", () => {
    const now = Date.parse("2026-10-07T21:00:00.000Z");
    assert.equal(
      shouldSendOpsAlert("2026-10-07T20:20:00.000Z", now, 30 * 60 * 1000),
      true
    );
  });
});

describe("evaluateHealthUptimeCheck", () => {
  it("passes a healthy payload", () => {
    assert.deepEqual(
      evaluateHealthUptimeCheck({
        status: 200,
        body: { ok: true, supabase: true, emailFromVerified: false },
      }),
      { ok: true }
    );
  });

  it("fails when Supabase is down even if ok is true", () => {
    const result = evaluateHealthUptimeCheck({
      status: 200,
      body: { ok: true, supabase: false },
    });
    assert.equal(result.ok, false);
  });

  it("fails on a non-200", () => {
    const result = evaluateHealthUptimeCheck({ status: 500, body: { ok: true } });
    assert.equal(result.ok, false);
  });
});

describe("resolveOpsAlertIngestUrl", () => {
  it("prefers NEXT_PUBLIC_APP_URL", () => {
    assert.equal(
      resolveOpsAlertIngestUrl({
        NEXT_PUBLIC_APP_URL: "https://www.playeroneiq.com/",
        VERCEL_URL: "player-one-iq.vercel.app",
      } as NodeJS.ProcessEnv),
      "https://www.playeroneiq.com/api/ops/alert"
    );
  });
});

describe("shouldAlertOAuthFailure", () => {
  it("skips user cancel and expired state", () => {
    assert.equal(shouldAlertOAuthFailure("access_denied"), false);
    assert.equal(shouldAlertOAuthFailure("invalid_state"), false);
  });

  it("alerts on unexpected provider failures", () => {
    assert.equal(shouldAlertOAuthFailure("insufficient_scope"), true);
    assert.equal(shouldAlertOAuthFailure("tiktok_invalid_client_key"), true);
  });
});
