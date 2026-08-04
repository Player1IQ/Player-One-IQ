import assert from "node:assert/strict";
import { test } from "node:test";
import { SEASON_XP_AMOUNTS } from "@/lib/creator-seasons/config";

test("recommendation_complete awards 30 XP", () => {
  assert.equal(SEASON_XP_AMOUNTS.recommendation_complete, 30);
});

test("recommendation source keys are unique per recommendation id", () => {
  const ids = ["content-clip-repurpose", "sponsors-engagement-ready", "posting-cadence-missed"];
  const sourceKeys = ids.map((id) => `recommendation:${id}`);
  assert.equal(new Set(sourceKeys).size, sourceKeys.length);
});
