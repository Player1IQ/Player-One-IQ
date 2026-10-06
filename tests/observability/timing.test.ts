import assert from "node:assert/strict";
import { test } from "node:test";
import { withTimeout } from "@/lib/observability/timing";

test("withTimeout returns the value when the work finishes first", async () => {
  const value = await withTimeout(async () => "ok", 200, "fallback");
  assert.equal(value, "ok");
});

test("withTimeout returns the fallback when the work hangs", async () => {
  const value = await withTimeout(
    () => new Promise<string>(() => undefined),
    30,
    "fallback"
  );
  assert.equal(value, "fallback");
});
