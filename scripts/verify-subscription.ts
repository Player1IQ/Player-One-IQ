import assert from "node:assert/strict";
import {
  getDefaultPlanForOrgType,
  parsePlanLimits,
  upgradePaths,
} from "../src/lib/subscription/plans";
import {
  getLimitForMetric,
  hasAnyAiFeature,
  hasAnyFeature,
  hasFeature,
  isWithinLimit,
  navItemAccessible,
} from "../src/lib/subscription/features";
import type { FeatureKey } from "../src/lib/subscription/types";

// Default plan mapping
assert.equal(getDefaultPlanForOrgType("Creator Organization"), "free_creator");
assert.equal(getDefaultPlanForOrgType("Brand / Sponsor"), "sponsor");
assert.equal(getDefaultPlanForOrgType("Gaming Agency"), "agency");

// Limits parsing
assert.deepEqual(parsePlanLimits({ creators: 1, team_members: 0, ai_requests: 50 }), {
  creators: 1,
  team_members: 0,
  opportunities: null,
  campaigns: null,
  ai_requests: 50,
});

// Feature checks
const freeCreatorFeatures = new Set<FeatureKey>([
  "creator_profiles",
  "apply_opportunities",
  "limited_analytics",
]);
assert.equal(hasFeature(freeCreatorFeatures, "creator_profiles"), true);
assert.equal(hasFeature(freeCreatorFeatures, "team_management"), false);
assert.equal(hasAnyAiFeature(freeCreatorFeatures), false);

const proFeatures = new Set<FeatureKey>([
  ...freeCreatorFeatures,
  "ai_growth",
  "advanced_analytics",
]);
assert.equal(hasAnyAiFeature(proFeatures), true);

// Usage limits
assert.equal(isWithinLimit(0, 1), true);
assert.equal(isWithinLimit(1, 1), false);
assert.equal(isWithinLimit(100, null), true);

const limits = parsePlanLimits({ creators: 1, team_members: 0 });
assert.equal(getLimitForMetric(limits, "creators"), 1);

// Nav gating
assert.equal(
  navItemAccessible(freeCreatorFeatures, "team_management"),
  false
);
assert.equal(
  navItemAccessible(freeCreatorFeatures, [
    "apply_opportunities",
    "create_opportunities",
  ]),
  true
);

// Upgrade paths
assert.deepEqual(upgradePaths.free_creator, ["creator_pro"]);
assert.deepEqual(upgradePaths.agency_pro, []);

console.log("verify-subscription: all checks passed");
