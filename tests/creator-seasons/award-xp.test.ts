import assert from "node:assert/strict";
import { test } from "node:test";
import { SEASON_XP_AMOUNTS } from "@/lib/creator-seasons/config";
import { recommendationSourceKey } from "@/lib/creator-seasons/sync-coach-xp";

test("recommendation_complete awards 30 XP", () => {
  assert.equal(SEASON_XP_AMOUNTS.recommendation_complete, 30);
});

test("recommendation source keys are unique per completion instance", () => {
  const recommendationId = "content-clip-repurpose";
  const dayOne = recommendationSourceKey(recommendationId, "state-1", "2026-08-01");
  const dayTwo = recommendationSourceKey(recommendationId, "state-2", "2026-08-02");
  const sameDayDifferentState = recommendationSourceKey(
    recommendationId,
    "state-3",
    "2026-08-01"
  );

  assert.notEqual(dayOne, dayTwo);
  assert.notEqual(dayOne, sameDayDifferentState);
  assert.equal(dayOne, "recommendation:content-clip-repurpose:state-1");
  assert.equal(dayTwo, "recommendation:content-clip-repurpose:state-2");
});

test("same recommendation on two different dates produces distinct source keys", () => {
  const recommendationId = "posting-cadence-missed";
  const monday = recommendationSourceKey(
    recommendationId,
    null,
    "2026-08-04"
  );
  const tuesday = recommendationSourceKey(
    recommendationId,
    null,
    "2026-08-05"
  );

  assert.notEqual(monday, tuesday);
  assert.equal(monday, "recommendation:posting-cadence-missed:2026-08-04");
  assert.equal(tuesday, "recommendation:posting-cadence-missed:2026-08-05");
});
