export const planCodes = [
  "free_creator",
  "creator_pro",
  "agency_starter",
  "agency",
  "agency_pro",
  "sponsor",
  "sponsor_pro",
] as const;

export type PlanCode = (typeof planCodes)[number];

export type TierGroup = "creator" | "agency" | "sponsor";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "paused";

export type BillingInterval = "monthly" | "yearly";

export interface PlanLimits {
  creators: number | null;
  team_members: number | null;
  opportunities: number | null;
  campaigns: number | null;
  ai_requests: number | null;
}

export const featureKeys = [
  "creator_profiles",
  "apply_opportunities",
  "create_opportunities",
  "limited_analytics",
  "advanced_analytics",
  "ai_growth",
  "ai_sponsorship",
  "revenue_forecasting",
  "monthly_reports",
  "team_management",
  "contracts",
  "sponsor_crm",
  "opportunity_management",
  "ai_creator_performance",
  "ai_sponsorship_matching",
  "ai_contract_summaries",
  "ai_forecasting",
  "ai_deal_recommendations",
  "white_label",
  "api_access",
  "review_creators",
  "messaging",
  "campaign_tracking",
  "ai_creator_discovery",
  "ai_campaign_recommendations",
  "ai_roi_forecasting",
  "advanced_reporting",
] as const;

export type FeatureKey = (typeof featureKeys)[number];

export type UsageMetricKey =
  | "creators"
  | "team_members"
  | "opportunities"
  | "campaigns"
  | "ai_requests";

export type AiAssistantType = "growth" | "sponsorship" | "revenue";

export interface SubscriptionPlan {
  id: string;
  code: PlanCode;
  name: string;
  description: string;
  tierGroup: TierGroup;
  priceMonthlyCents: number;
  priceYearlyCents: number | null;
  limits: PlanLimits;
  features: FeatureKey[];
  sortOrder: number;
}

export interface OrganizationSubscription {
  id: string;
  organizationId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt: string | null;
  canceledAt: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export interface UsageSnapshot {
  metricKey: UsageMetricKey;
  count: number;
  limit: number | null;
  periodMonth: string;
}

export interface AiUsageSummary {
  assistantType: AiAssistantType;
  requestCount: number;
  tokensUsed: number;
}

export interface SubscriptionContext {
  subscription: OrganizationSubscription | null;
  features: Set<FeatureKey>;
  limits: PlanLimits;
  usage: UsageSnapshot[];
}
