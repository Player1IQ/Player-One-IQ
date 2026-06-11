import type { FeatureKey, PlanLimits, UsageMetricKey } from "./types";

export const featureLabels: Record<FeatureKey, string> = {
  creator_profiles: "Creator profiles",
  apply_opportunities: "Apply to opportunities",
  create_opportunities: "Create opportunities",
  limited_analytics: "Limited analytics",
  advanced_analytics: "Advanced analytics",
  ai_growth: "AI growth recommendations",
  ai_sponsorship: "AI sponsorship suggestions",
  revenue_forecasting: "Revenue forecasting",
  monthly_reports: "Monthly reports",
  team_management: "Team management",
  contracts: "Contracts",
  sponsor_crm: "Sponsor CRM",
  opportunity_management: "Opportunity management",
  ai_creator_performance: "AI creator performance analysis",
  ai_sponsorship_matching: "AI sponsorship matching",
  ai_contract_summaries: "AI contract summaries",
  ai_forecasting: "AI forecasting",
  ai_deal_recommendations: "AI deal recommendations",
  white_label: "White-label options",
  api_access: "API access",
  review_creators: "Review creators",
  messaging: "Messaging",
  campaign_tracking: "Campaign tracking",
  ai_creator_discovery: "AI creator discovery",
  ai_campaign_recommendations: "AI campaign recommendations",
  ai_roi_forecasting: "AI ROI forecasting",
  advanced_reporting: "Advanced reporting",
};

export const aiFeatureKeys: FeatureKey[] = [
  "ai_growth",
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
      advanced_analytics: "Creator Pro",
      ai_growth: "Creator Pro",
      ai_sponsorship: "Creator Pro",
      revenue_forecasting: "Creator Pro",
      monthly_reports: "Creator Pro",
      team_management: "Agency",
    },
    agency: {
      ai_forecasting: "Agency Pro",
      ai_deal_recommendations: "Agency Pro",
      white_label: "Agency Pro",
      api_access: "Agency Pro",
    },
    sponsor: {
      ai_creator_discovery: "Sponsor Pro",
      ai_campaign_recommendations: "Sponsor Pro",
      ai_roi_forecasting: "Sponsor Pro",
      advanced_reporting: "Sponsor Pro",
      advanced_analytics: "Sponsor Pro",
    },
  };

  return (
    tierUpgrades[tierGroup]?.[feature] ??
    (tierGroup === "creator"
      ? "Creator Pro"
      : tierGroup === "agency"
        ? "Agency Pro"
        : "Sponsor Pro")
  );
}
