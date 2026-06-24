import assert from "node:assert/strict";
import { test } from "node:test";
import {
  API_KEY_PREFIX,
  generateApiKey,
  hashApiKey,
  verifyApiKeyFormat,
  verifyApiKeyHash,
} from "@/lib/api/keys";

test("generateApiKey returns poiq_ prefixed secrets with stable hash", () => {
  const originalPepper = process.env.API_KEY_PEPPER;
  process.env.API_KEY_PEPPER = "test-pepper";

  try {
    const generated = generateApiKey();
    assert.ok(generated.fullKey.startsWith(API_KEY_PREFIX));
    assert.ok(verifyApiKeyFormat(generated.fullKey));
    assert.equal(generated.keyHash, hashApiKey(generated.fullKey));
    assert.ok(verifyApiKeyHash(generated.fullKey, generated.keyHash));
    assert.equal(
      verifyApiKeyHash(`${generated.fullKey}x`, generated.keyHash),
      false
    );
  } finally {
    if (originalPepper === undefined) {
      delete process.env.API_KEY_PEPPER;
    } else {
      process.env.API_KEY_PEPPER = originalPepper;
    }
  }
});

test("verifyApiKeyFormat rejects invalid keys", () => {
  assert.equal(verifyApiKeyFormat("not-a-key"), false);
  assert.equal(verifyApiKeyFormat(`${API_KEY_PREFIX}short`), false);
});
