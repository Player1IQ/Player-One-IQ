import test from "node:test";
import assert from "node:assert/strict";
import {
  getProgressToNextTier,
  getTierForXp,
  SEASON_XP_AMOUNTS,
} from "../../src/lib/creator-seasons/config";

test("getTierForXp returns rookie at zero", () => {
  assert.equal(getTierForXp(0).tier, 1);
  assert.equal(getTierForXp(0).title, "Rookie");
});

test("getTierForXp advances at thresholds", () => {
  assert.equal(getTierForXp(99).tier, 1);
  assert.equal(getTierForXp(100).tier, 2);
  assert.equal(getTierForXp(250).tier, 3);
});

test("getProgressToNextTier calculates percent within tier", () => {
  const progress = getProgressToNextTier(175);
  assert.equal(progress.nextTier?.tier, 3);
  assert.equal(progress.xpToNext, 75);
  assert.equal(progress.percent, 50);
});

test("season xp amounts are positive", () => {
  for (const amount of Object.values(SEASON_XP_AMOUNTS)) {
    assert.ok(amount > 0);
  }
});
