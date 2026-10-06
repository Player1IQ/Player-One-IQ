import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  domainIsVerified,
  evaluateEmailFrom,
  formatFromAddress,
  getAdminReplyTo,
  isResendTestDomain,
  parseFromAddress,
} from "@/lib/email/from";

describe("parseFromAddress", () => {
  it("reads Name <email> headers", () => {
    const parsed = parseFromAddress("Player One IQ <Admin@playeroneiq.com>");
    assert.deepEqual(parsed, {
      name: "Player One IQ",
      email: "Admin@playeroneiq.com",
      domain: "playeroneiq.com",
    });
    assert.equal(
      formatFromAddress(parsed!),
      "Player One IQ <Admin@playeroneiq.com>"
    );
  });

  it("reads a bare address", () => {
    const parsed = parseFromAddress("Admin@playeroneiq.com");
    assert.equal(parsed?.email, "Admin@playeroneiq.com");
    assert.equal(parsed?.name, null);
  });

  it("recovers a display name when angle brackets were omitted", () => {
    const parsed = parseFromAddress("Player One IQ Admin@playeroneiq.com");
    assert.deepEqual(parsed, {
      name: "Player One IQ",
      email: "Admin@playeroneiq.com",
      domain: "playeroneiq.com",
    });
  });
});

describe("evaluateEmailFrom", () => {
  it("refuses resend.dev in production", () => {
    const result = evaluateEmailFrom({
      fromRaw: "Player One IQ <onboarding@resend.dev>",
      vercelEnv: "production",
      verifiedDomains: ["playeroneiq.com"],
    });
    assert.equal(result.ok, false);
    assert.equal(result.verified, false);
    assert.equal(result.status, "resend_test_domain");
  });

  it("refuses resend.dev even when it is the only configured From", () => {
    const result = evaluateEmailFrom({
      fromRaw: "onboarding@resend.dev",
      vercelEnv: "preview",
      verifiedDomains: [],
    });
    assert.equal(result.ok, false);
    assert.equal(isResendTestDomain(result.domain ?? ""), true);
  });

  it("refuses an unverified custom domain", () => {
    const result = evaluateEmailFrom({
      fromRaw: "Player One IQ <hello@example.com>",
      vercelEnv: "production",
      verifiedDomains: ["playeroneiq.com"],
    });
    assert.equal(result.ok, false);
    assert.match(result.error, /not verified in Resend/);
  });

  it("accepts a verified playeroneiq.com From", () => {
    const result = evaluateEmailFrom({
      fromRaw: "Player One IQ Admin@playeroneiq.com",
      vercelEnv: "production",
      verifiedDomains: ["playeroneiq.com"],
    });
    assert.deepEqual(result, {
      ok: true,
      verified: true,
      domain: "playeroneiq.com",
      status: "verified",
      from: "Player One IQ <Admin@playeroneiq.com>",
    });
  });

  it("allows a custom From when Resend domain lookup fails", () => {
    const result = evaluateEmailFrom({
      fromRaw: "Admin@playeroneiq.com",
      vercelEnv: "production",
      verifiedDomains: null,
    });
    assert.equal(result.ok, true);
    assert.equal(result.verified, false);
    assert.equal(result.status, "lookup_failed");
  });
});

describe("domainIsVerified", () => {
  it("does not treat resend.dev as verified", () => {
    assert.equal(domainIsVerified("resend.dev", ["resend.dev"]), false);
  });
});

describe("getAdminReplyTo", () => {
  it("uses FOUNDING_APPLICATION_NOTIFY_EMAIL when set", () => {
    assert.equal(
      getAdminReplyTo({
        FOUNDING_APPLICATION_NOTIFY_EMAIL: "Admin@playeroneiq.com",
        INVITE_EMAIL_FROM: "Player One IQ <noreply@playeroneiq.com>",
      } as NodeJS.ProcessEnv),
      "Admin@playeroneiq.com"
    );
  });
});
