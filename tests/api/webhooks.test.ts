import assert from "node:assert/strict";
import { test } from "node:test";
import {
  generateWebhookSecret,
  isValidWebhookUrl,
  signWebhookPayload,
  WEBHOOK_SECRET_PREFIX,
} from "@/lib/api/webhook-crypto";

test("generateWebhookSecret returns whsec_ prefixed secrets", () => {
  const secret = generateWebhookSecret();
  assert.ok(secret.startsWith(WEBHOOK_SECRET_PREFIX));
  assert.ok(secret.length > WEBHOOK_SECRET_PREFIX.length + 16);
});

test("signWebhookPayload produces stable sha256 HMAC", () => {
  const body = JSON.stringify({ event: "application.created", data: {} });
  const signature = signWebhookPayload("whsec_test", body);
  assert.match(signature, /^sha256=[a-f0-9]{64}$/);
  assert.equal(signWebhookPayload("whsec_test", body), signature);
  assert.notEqual(signWebhookPayload("whsec_other", body), signature);
});

test("isValidWebhookUrl allows https and localhost http in development", () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";

  try {
    assert.equal(isValidWebhookUrl("https://webhook.site/abc"), true);
    assert.equal(isValidWebhookUrl("http://localhost:3000/hook"), true);
    assert.equal(isValidWebhookUrl("http://127.0.0.1/hook"), true);
    assert.equal(isValidWebhookUrl("http://example.com/hook"), false);
    assert.equal(isValidWebhookUrl("not-a-url"), false);
  } finally {
    process.env.NODE_ENV = originalEnv;
  }
});

test("isValidWebhookUrl requires https in production", () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";

  try {
    assert.equal(isValidWebhookUrl("https://webhook.site/abc"), true);
    assert.equal(isValidWebhookUrl("http://localhost:3000/hook"), false);
  } finally {
    process.env.NODE_ENV = originalEnv;
  }
});
