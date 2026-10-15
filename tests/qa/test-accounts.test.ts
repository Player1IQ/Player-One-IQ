import test from "node:test";
import assert from "node:assert/strict";
import { isQaTestEmail } from "@/lib/qa/test-accounts";

test("example.com emails are treated as QA test accounts", () => {
  assert.equal(isQaTestEmail("poiq.e2e.creator.1@example.com"), true);
  assert.equal(isQaTestEmail("  POIQ.LAUNCH.AGENCY@EXAMPLE.COM  "), true);
});

test("real emails are not QA test accounts", () => {
  assert.equal(isQaTestEmail("founder@playeroneiq.com"), false);
  assert.equal(isQaTestEmail(null), false);
  assert.equal(isQaTestEmail(""), false);
});
