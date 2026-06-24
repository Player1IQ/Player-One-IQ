import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getOrganizationForUser,
  getOrganizationId,
} from "@/lib/organization/queries";
import { hasFeature } from "./features";
import { getDefaultPlanForOrgType, parsePlanLimits, planCatalog } from "./plans";
import { expirePlatformTrialIfNeeded } from "./trial-lifecycle";
import {
  applyPlatformTrialLimits,
  isPlatformTrialActive,
} from "./trials";
import type {
  AiUsageSummary,
  FeatureKey,
  OrganizationSubscription,
  SubscriptionContext,
  SubscriptionPlan,
  UsageMetricKey,
  UsageSnapshot,
} from "./types";

function mapPlanRow(row: {
  id: string;
  code: string;
  name: string;
  description: string;
  tier_group: string;
  price_monthly_cents: number;
  price_yearly_cents: number | null;
  limits: unknown;
  features: unknown;
  sort_order: number;
}): SubscriptionPlan {
  return {
    id: row.id,
    code: row.code as SubscriptionPlan["code"],
    name: row.name,
    description: row.description,
    tierGroup: row.tier_group as SubscriptionPlan["tierGroup"],
    priceMonthlyCents: row.price_monthly_cents,
    priceYearlyCents: row.price_yearly_cents,
    limits: parsePlanLimits(row.limits),
    features: (Array.isArray(row.features) ? row.features : []) as FeatureKey[],
    sortOrder: row.sort_order,
  };
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return (data ?? []).map(mapPlanRow);
}

export async function getOrganizationSubscription(): Promise<OrganizationSubscription | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const organizationId = await getOrganizationId();
  if (!organizationId) return null;

  const { data, error } = await supabase
    .from("organization_subscriptions")
    .select(
      `
      id,
      organization_id,
      status,
      billing_interval,
      current_period_start,
      current_period_end,
      trial_ends_at,
      canceled_at,
      stripe_customer_id,
      stripe_subscription_id,
      metadata,
      plan:subscription_plans (
        id,
        code,
        name,
        description,
        tier_group,
        price_monthly_cents,
        price_yearly_cents,
        limits,
        features,
        sort_order
      )
    `
    )
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    if (error.code !== "PGRST116" && error.code !== "42P01") {
      console.error("organization_subscriptions query failed:", error.message);
    }
    return null;
  }

  if (!data?.plan) return null;

  const plan = Array.isArray(data.plan) ? data.plan[0] : data.plan;
  if (!plan) return null;

  return {
    id: data.id,
    organizationId: data.organization_id,
    plan: mapPlanRow(plan),
    status: data.status,
    billingInterval: data.billing_interval,
    currentPeriodStart: data.current_period_start,
    currentPeriodEnd: data.current_period_end,
    trialEndsAt: data.trial_ends_at,
    canceledAt: data.canceled_at,
    stripeCustomerId: data.stripe_customer_id,
    stripeSubscriptionId: data.stripe_subscription_id,
    metadata:
      data.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata)
        ? (data.metadata as Record<string, unknown>)
        : {},
  };
}

async function getFeatureFlagOverrides(
  organizationId: string,
  supabase?: SupabaseClient | null
): Promise<Map<string, boolean>> {
  const client = supabase ?? createServiceClient() ?? (await createClient());
  if (!client) return new Map();

  const { data } = await client
    .from("feature_flags")
    .select("flag_key, enabled, organization_id")
    .or(`organization_id.is.null,organization_id.eq.${organizationId}`);

  const overrides = new Map<string, boolean>();
  for (const row of data ?? []) {
    if (row.organization_id === null) {
      overrides.set(row.flag_key, row.enabled);
    }
  }
  for (const row of data ?? []) {
    if (row.organization_id === organizationId) {
      overrides.set(row.flag_key, row.enabled);
    }
  }
  return overrides;
}

export async function resolveOrganizationFeatures(
  plan: SubscriptionPlan,
  organizationId: string,
  supabase?: SupabaseClient | null
): Promise<Set<FeatureKey>> {
  const features = new Set(plan.features);
  const overrides = await getFeatureFlagOverrides(organizationId, supabase);

  for (const [key, enabled] of overrides) {
    if (enabled && featureKeysIncludes(key)) {
      features.add(key as FeatureKey);
    } else if (!enabled && featureKeysIncludes(key)) {
      features.delete(key as FeatureKey);
    }
  }

  return features;
}

function featureKeysIncludes(key: string): boolean {
  return [
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
  ].includes(key);
}

function currentPeriodMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export async function getUsageSnapshots(
  limits: SubscriptionPlan["limits"]
): Promise<UsageSnapshot[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const periodMonth = currentPeriodMonth();
  const metrics: UsageMetricKey[] = [
    "creators",
    "team_members",
    "opportunities",
    "campaigns",
    "ai_requests",
  ];

  const { data: tracked } = await supabase
    .from("usage_tracking")
    .select("metric_key, count")
    .eq("organization_id", organizationId)
    .eq("period_month", periodMonth);

  const trackedMap = new Map(
    (tracked ?? []).map((row) => [row.metric_key, row.count])
  );

  const [creatorCount, teamCount, opportunityCount] = await Promise.all([
    supabase
      .from("creators")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "active"),
    supabase
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
  ]);

  const liveCounts: Record<string, number> = {
    creators: creatorCount.count ?? 0,
    team_members: teamCount.count ?? 0,
    opportunities: opportunityCount.count ?? 0,
    campaigns: trackedMap.get("campaigns") ?? 0,
    ai_requests: trackedMap.get("ai_requests") ?? 0,
  };

  return metrics.map((metricKey) => ({
    metricKey,
    count: liveCounts[metricKey] ?? trackedMap.get(metricKey) ?? 0,
    limit: limits[metricKey] ?? null,
    periodMonth,
  }));
}

export async function getAiUsageSummary(): Promise<AiUsageSummary[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const periodMonth = currentPeriodMonth();

  const { data } = await supabase
    .from("ai_usage_tracking")
    .select("assistant_type, tokens_used")
    .eq("organization_id", organizationId)
    .eq("period_month", periodMonth);

  const summary = new Map<string, { requestCount: number; tokensUsed: number }>();

  for (const row of data ?? []) {
    const existing = summary.get(row.assistant_type) ?? {
      requestCount: 0,
      tokensUsed: 0,
    };
    summary.set(row.assistant_type, {
      requestCount: existing.requestCount + 1,
      tokensUsed: existing.tokensUsed + (row.tokens_used ?? 0),
    });
  }

  return (["growth", "sponsorship", "revenue"] as const).map((assistantType) => ({
    assistantType,
    requestCount: summary.get(assistantType)?.requestCount ?? 0,
    tokensUsed: summary.get(assistantType)?.tokensUsed ?? 0,
  }));
}

export async function getOrganizationSubscriptionByOrganizationId(
  organizationId: string
): Promise<OrganizationSubscription | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("organization_subscriptions")
    .select(
      `
      id,
      organization_id,
      status,
      billing_interval,
      current_period_start,
      current_period_end,
      trial_ends_at,
      canceled_at,
      stripe_customer_id,
      stripe_subscription_id,
      metadata,
      plan:subscription_plans (
        id,
        code,
        name,
        description,
        tier_group,
        price_monthly_cents,
        price_yearly_cents,
        limits,
        features,
        sort_order
      )
    `
    )
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    if (error.code !== "PGRST116" && error.code !== "42P01") {
      console.error("organization_subscriptions query failed:", error.message);
    }
    return null;
  }

  if (!data?.plan) return null;

  const plan = Array.isArray(data.plan) ? data.plan[0] : data.plan;
  if (!plan) return null;

  return {
    id: data.id,
    organizationId: data.organization_id,
    plan: mapPlanRow(plan),
    status: data.status,
    billingInterval: data.billing_interval,
    currentPeriodStart: data.current_period_start,
    currentPeriodEnd: data.current_period_end,
    trialEndsAt: data.trial_ends_at,
    canceledAt: data.canceled_at,
    stripeCustomerId: data.stripe_customer_id,
    stripeSubscriptionId: data.stripe_subscription_id,
    metadata:
      data.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata)
        ? (data.metadata as Record<string, unknown>)
        : {},
  };
}

function isSubscriptionEntitled(status: OrganizationSubscription["status"]): boolean {
  return status === "active" || status === "trialing";
}

export async function organizationHasFeature(
  organizationId: string,
  feature: FeatureKey
): Promise<boolean> {
  const supabase = createServiceClient();
  let subscription =
    await getOrganizationSubscriptionByOrganizationId(organizationId);

  if (subscription) {
    subscription = await expirePlatformTrialIfNeeded(subscription);
    if (!isSubscriptionEntitled(subscription.status)) {
      return false;
    }

    const features = await resolveOrganizationFeatures(
      subscription.plan,
      organizationId,
      supabase
    );
    return hasFeature(features, feature);
  }

  if (!supabase) return false;

  const { data: organization } = await supabase
    .from("organizations")
    .select("type")
    .eq("id", organizationId)
    .maybeSingle();

  const planCode = getDefaultPlanForOrgType(organization?.type ?? "");
  return planCatalog[planCode].features.includes(feature);
}

async function getFallbackSubscriptionContext(): Promise<SubscriptionContext> {
  const organization = await getOrganizationForUser();
  const planCode = getDefaultPlanForOrgType(organization?.type ?? "");
  const catalog = planCatalog[planCode];

  return {
    subscription: null,
    features: new Set(catalog.features),
    limits: catalog.limits,
    usage: [],
  };
}

export async function getSubscriptionContext(): Promise<SubscriptionContext> {
  let subscription = await getOrganizationSubscription();
  if (!subscription) {
    return getFallbackSubscriptionContext();
  }

  subscription = await expirePlatformTrialIfNeeded(subscription);

  const features = await resolveOrganizationFeatures(
    subscription.plan,
    subscription.organizationId
  );

  const limits = isPlatformTrialActive(
    subscription.status,
    subscription.trialEndsAt,
    subscription.stripeSubscriptionId
  )
    ? applyPlatformTrialLimits(subscription.plan, subscription.plan.limits)
    : subscription.plan.limits;

  const usage = await getUsageSnapshots(limits);

  return {
    subscription,
    features,
    limits,
    usage,
  };
}
