import enSubscription from "../../../messages/en/subscription.json";
import type {
  FeatureKey,
  PlanCode,
  PlanLimits,
  SubscriptionPlan,
  TierGroup,
} from "./types";

/** In-code fallback when DB subscription row is missing */
export const planCatalog: Record<
  PlanCode,
  { limits: PlanLimits; features: FeatureKey[] }
> = {
  free_creator: {
    limits: { creators: 1, team_members: 0, opportunities: null, campaigns: null, ai_requests: 0 },
    features: ["creator_profiles", "apply_opportunities", "limited_analytics"],
  },
  creator_pro: {
    limits: { creators: null, team_members: 0, opportunities: null, campaigns: null, ai_requests: 50 },
    features: [
      "creator_profiles",
      "apply_opportunities",
      "advanced_analytics",
      "ai_growth",
      "ai_creator_coach",
      "ai_sponsorship",
      "revenue_forecasting",
      "monthly_reports",
    ],
  },
  agency_starter: {
    limits: { creators: 5, team_members: 2, opportunities: null, campaigns: null, ai_requests: 0 },
    features: [
      "creator_profiles",
      "team_management",
      "contracts",
      "sponsor_crm",
      "messaging",
      "limited_analytics",
    ],
  },
  agency: {
    limits: { creators: 25, team_members: null, opportunities: null, campaigns: null, ai_requests: 200 },
    features: [
      "creator_profiles",
      "team_management",
      "contracts",
      "sponsor_crm",
      "opportunity_management",
      "advanced_analytics",
      "ai_creator_performance",
      "ai_sponsorship_matching",
      "ai_contract_summaries",
      "ai_creator_coach",
      "messaging",
    ],
  },
  agency_pro: {
    limits: { creators: null, team_members: null, opportunities: null, campaigns: null, ai_requests: 500 },
    features: [
      "creator_profiles",
      "team_management",
      "contracts",
      "sponsor_crm",
      "opportunity_management",
      "advanced_analytics",
      "ai_creator_performance",
      "ai_sponsorship_matching",
      "ai_contract_summaries",
      "ai_forecasting",
      "ai_deal_recommendations",
      "ai_creator_coach",
      "white_label",
      "api_access",
      "messaging",
    ],
  },
  sponsor: {
    limits: { creators: null, team_members: null, opportunities: null, campaigns: 5, ai_requests: 0 },
    features: [
      "create_opportunities",
      "review_creators",
      "messaging",
      "limited_analytics",
      "campaign_tracking",
    ],
  },
  sponsor_pro: {
    limits: { creators: null, team_members: null, opportunities: null, campaigns: null, ai_requests: 75 },
    features: [
      "create_opportunities",
      "review_creators",
      "messaging",
      "advanced_analytics",
      "campaign_tracking",
      "ai_creator_discovery",
      "ai_campaign_recommendations",
      "ai_roi_forecasting",
      "advanced_reporting",
    ],
  },
};

export const planHighlights: Record<
  PlanCode,
  { tagline: string; bullets: string[] }
> = {
  free_creator: enSubscription.plans.free_creator,
  creator_pro: enSubscription.plans.creator_pro,
  agency_starter: enSubscription.plans.agency_starter,
  agency: enSubscription.plans.agency,
  agency_pro: enSubscription.plans.agency_pro,
  sponsor: enSubscription.plans.sponsor,
  sponsor_pro: enSubscription.plans.sponsor_pro,
};

export const upgradePaths: Record<PlanCode, PlanCode[]> = {
  free_creator: ["creator_pro"],
  creator_pro: [],
  agency_starter: ["agency", "agency_pro"],
  agency: ["agency_pro"],
  agency_pro: [],
  sponsor: ["sponsor_pro"],
  sponsor_pro: [],
};

export function getDefaultPlanForOrgType(orgType: string): PlanCode {
  if (orgType === "Brand / Sponsor") return "sponsor";
  if (orgType === "Creator / Player") return "free_creator";
  if (
    [
      "Gaming Agency",
      "Esports Team",
      "Multi-Channel Network",
      "Talent Management Firm",
    ].includes(orgType)
  ) {
    return "agency_starter";
  }
  return "free_creator";
}

export function formatPlanPrice(
  cents: number,
  interval: "monthly" | "yearly",
  freeLabel: string = enSubscription.pricing.free
) {
  if (cents === 0) return freeLabel;
  const amount = (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return interval === "yearly" ? `${amount}/yr` : `${amount}/mo`;
}

export function planPriceCents(
  plan: SubscriptionPlan,
  billingInterval: "monthly" | "yearly"
): number {
  if (billingInterval === "yearly" && plan.priceYearlyCents !== null) {
    return plan.priceYearlyCents;
  }
  return plan.priceMonthlyCents;
}

export function planRequiresStripeCheckout(
  plan: SubscriptionPlan,
  billingInterval: "monthly" | "yearly"
): boolean {
  return planPriceCents(plan, billingInterval) > 0;
}

export function plansInTierGroup(
  plans: SubscriptionPlan[],
  tierGroup: TierGroup
): SubscriptionPlan[] {
  return plans
    .filter((p) => p.tierGroup === tierGroup)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function parsePlanLimits(raw: unknown): PlanLimits {
  const value = (raw ?? {}) as Record<string, unknown>;
  const num = (key: keyof PlanLimits) => {
    const v = value[key];
    if (v === null || v === undefined) return null;
    return typeof v === "number" ? v : null;
  };
  return {
    creators: num("creators"),
    team_members: num("team_members"),
    opportunities: num("opportunities"),
    campaigns: num("campaigns"),
    ai_requests: num("ai_requests"),
  };
}
