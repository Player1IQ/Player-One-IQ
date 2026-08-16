import enSubscription from "../../../messages/en/subscription.json";
import type { FeatureKey, PlanLimits, UsageMetricKey } from "./types";

export const featureLabels: Record<FeatureKey, string> = {
  creator_profiles: enSubscription.features.creator_profiles,
  apply_opportunities: enSubscription.features.apply_opportunities,
  create_opportunities: enSubscription.features.create_opportunities,
  limited_analytics: enSubscription.features.limited_analytics,
  advanced_analytics: enSubscription.features.advanced_analytics,
  ai_growth: enSubscription.features.ai_growth,
  ai_creator_coach: enSubscription.features.ai_creator_coach,
  ai_sponsorship: enSubscription.features.ai_sponsorship,
  revenue_forecasting: enSubscription.features.revenue_forecasting,
  monthly_reports: enSubscription.features.monthly_reports,
  team_management: enSubscription.features.team_management,
  contracts: enSubscription.features.contracts,
  sponsor_crm: enSubscription.features.sponsor_crm,
  opportunity_management: enSubscription.features.opportunity_management,
  ai_creator_performance: enSubscription.features.ai_creator_performance,
  ai_sponsorship_matching: enSubscription.features.ai_sponsorship_matching,
  ai_contract_summaries: enSubscription.features.ai_contract_summaries,
  ai_forecasting: enSubscription.features.ai_forecasting,
  ai_deal_recommendations: enSubscription.features.ai_deal_recommendations,
  white_label: enSubscription.features.white_label,
  api_access: enSubscription.features.api_access,
  review_creators: enSubscription.features.review_creators,
  messaging: enSubscription.features.messaging,
  campaign_tracking: enSubscription.features.campaign_tracking,
  ai_creator_discovery: enSubscription.features.ai_creator_discovery,
  ai_campaign_recommendations: enSubscription.features.ai_campaign_recommendations,
  ai_roi_forecasting: enSubscription.features.ai_roi_forecasting,
  advanced_reporting: enSubscription.features.advanced_reporting,
};

export const creatorCoachFeatureKeys: FeatureKey[] = ["ai_creator_coach"];

export const creatorContentAnalysisFeatureKeys: FeatureKey[] = [
  "ai_growth",
  "ai_creator_performance",
];

export const aiFeatureKeys: FeatureKey[] = [
  "ai_growth",
  "ai_creator_coach",
  "ai_sponsorship",
  "revenue_forecasting",
  "ai_creator_performance",
  "ai_sponsorship_matching",
  "ai_contract_summaries",
  "ai_forecasting",
  "ai_deal_recommendations",
  "ai_creator_discovery",
  "ai_campaign_recommendations",
  "ai_roi_forecasting",
];

export function hasAnyAiFeature(features: Set<FeatureKey>): boolean {
  return aiFeatureKeys.some((key) => features.has(key));
}

export function hasFeature(
  features: Set<FeatureKey>,
  key: FeatureKey
): boolean {
  return features.has(key);
}

export function hasAnyFeature(
  features: Set<FeatureKey>,
  keys: FeatureKey[]
): boolean {
  return keys.some((key) => features.has(key));
}

export function getLimitForMetric(
  limits: PlanLimits,
  metric: UsageMetricKey
): number | null {
  return limits[metric] ?? null;
}

export function isWithinLimit(
  count: number,
  limit: number | null
): boolean {
  if (limit === null) return true;
  return count < limit;
}

export type NavFeatureRequirement = FeatureKey | FeatureKey[];

export function navItemAccessible(
  features: Set<FeatureKey>,
  requirement?: NavFeatureRequirement
): boolean {
  if (!requirement) return true;
  if (Array.isArray(requirement)) {
    return hasAnyFeature(features, requirement);
  }
  return hasFeature(features, requirement);
}

/** Maps nav href to required subscription features */
export const navFeatureRequirements: Record<string, NavFeatureRequirement> = {
  "/creators": [
    "creator_profiles",
    "review_creators",
    "sponsor_crm",
  ],
  "/sponsors": ["sponsor_crm"],
  "/campaigns": ["campaign_tracking"],
  "/contracts": ["contracts"],
  "/opportunities": [
    "apply_opportunities",
    "create_opportunities",
    "opportunity_management",
  ],
  "/messages": ["messaging"],
  "/team": ["team_management"],
  "/ai": aiFeatureKeys,
  "/reports": ["advanced_analytics", "monthly_reports"],
  "/billing": [],
};

export function getUpgradePlanForFeature(
  feature: FeatureKey,
  tierGroup: "creator" | "agency" | "sponsor"
): string {
  const tierUpgrades: Record<string, Partial<Record<FeatureKey, string>>> = {
    creator: {
      advanced_analytics: enSubscription.upgradePlans.creatorPro,
      ai_growth: enSubscription.upgradePlans.creatorPro,
      ai_creator_coach: enSubscription.upgradePlans.creatorPro,
      ai_sponsorship: enSubscription.upgradePlans.creatorPro,
      revenue_forecasting: enSubscription.upgradePlans.creatorPro,
      monthly_reports: enSubscription.upgradePlans.creatorPro,
      team_management: enSubscription.upgradePlans.agency,
    },
    agency: {
      ai_forecasting: enSubscription.upgradePlans.agencyPro,
      ai_deal_recommendations: enSubscription.upgradePlans.agencyPro,
      ai_creator_coach: enSubscription.upgradePlans.agencyPro,
      white_label: enSubscription.upgradePlans.agencyPro,
      api_access: enSubscription.upgradePlans.agencyPro,
    },
    sponsor: {
      ai_creator_discovery: enSubscription.upgradePlans.sponsorPro,
      ai_campaign_recommendations: enSubscription.upgradePlans.sponsorPro,
      ai_roi_forecasting: enSubscription.upgradePlans.sponsorPro,
      advanced_reporting: enSubscription.upgradePlans.sponsorPro,
      advanced_analytics: enSubscription.upgradePlans.sponsorPro,
    },
  };

  return (
    tierUpgrades[tierGroup]?.[feature] ??
    (tierGroup === "creator"
      ? enSubscription.upgradePlans.creatorPro
      : tierGroup === "agency"
        ? enSubscription.upgradePlans.agencyPro
        : enSubscription.upgradePlans.sponsorPro)
  );
}
