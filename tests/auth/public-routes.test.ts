import assert from "node:assert/strict";
import { test } from "node:test";
import { isPublicMiddlewarePath } from "@/lib/auth/public-routes";

test("cron routes bypass login so Vercel can send CRON_SECRET", () => {
  assert.equal(isPublicMiddlewarePath("/api/cron/notification-emails"), true);
  assert.equal(isPublicMiddlewarePath("/api/cron/sync-platform-revenue"), true);
  assert.equal(isPublicMiddlewarePath("/settings"), false);
});
