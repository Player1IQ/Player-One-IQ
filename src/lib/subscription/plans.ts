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
      "ai_sponsorship",
      "revenue_forecasting",
      "monthly_reports",
    ],
  },
  agency: {
    limits: { creators: 25, team_members: null, opportunities: null, campaigns: null, ai_requests: 100 },
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
      "messaging",
    ],
  },
  agency_pro: {
    limits: { creators: null, team_members: null, opportunities: null, campaigns: null, ai_requests: null },
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
  free_creator: {
    tagline: "Start your creator journey",
    bullets: [
      "1 creator profile",
      "Apply to opportunities",
      "Limited analytics",
    ],
  },
  creator_pro: {
    tagline: "Grow faster with AI",
    bullets: [
      "Unlimited opportunities",
      "Advanced analytics",
      "AI growth & sponsorship tools",
      "Revenue forecasting & monthly reports",
    ],
  },
  agency: {
    tagline: "Run your roster end-to-end",
    bullets: [
      "Up to 25 creators",
      "Team, contracts & sponsor CRM",
      "AI performance & matching",
      "Contract summaries",
    ],
  },
  agency_pro: {
    tagline: "Scale without limits",
    bullets: [
      "Unlimited creators & team",
      "AI forecasting & deal recommendations",
      "White-label options",
      "API access",
    ],
  },
  sponsor: {
    tagline: "Launch sponsorship campaigns",
    bullets: [
      "Create opportunities",
      "Review creators & message",
      "Analytics & campaign tracking",
    ],
  },
  sponsor_pro: {
    tagline: "Maximize campaign ROI",
    bullets: [
      "Unlimited campaigns",
      "AI creator discovery",
      "Campaign recommendations",
      "AI ROI forecasting & advanced reporting",
    ],
  },
};

export const upgradePaths: Record<PlanCode, PlanCode[]> = {
  free_creator: ["creator_pro"],
  creator_pro: [],
  agency: ["agency_pro"],
  agency_pro: [],
  sponsor: ["sponsor_pro"],
  sponsor_pro: [],
};

export function getDefaultPlanForOrgType(orgType: string): PlanCode {
  if (orgType === "Brand / Sponsor") return "sponsor";
  if (
    [
      "Gaming Agency",
      "Esports Team",
      "Multi-Channel Network",
      "Talent Management Firm",
    ].includes(orgType)
  ) {
    return "agency";
  }
  return "free_creator";
}

export function formatPlanPrice(cents: number, interval: "monthly" | "yearly") {
  if (cents === 0) return "Free";
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
