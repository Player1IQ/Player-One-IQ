import type { PlanCode, PlanLimits, SubscriptionPlan } from "./types";

/** Platform trial length for new workspaces (no Stripe subscription yet). */
export const PLATFORM_TRIAL_DAYS = 5;

/** Paid entry plan each org type starts on during trial. */
export function getTrialPlanForOrgType(orgType: string): PlanCode {
  if (orgType === "Brand / Sponsor") return "sponsor_pro";
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
  return "creator_pro";
}

/** Free plan after a platform trial expires without payment. */
export function getPostTrialPlanCode(trialPlanCode: PlanCode): PlanCode {
  switch (trialPlanCode) {
    case "agency":
    case "agency_pro":
      return "agency_starter";
    case "sponsor_pro":
      return "sponsor";
    case "creator_pro":
      return "free_creator";
    default:
      return trialPlanCode;
  }
}

const trialUsageCaps: Partial<Record<PlanCode, Partial<PlanLimits>>> = {
  agency: {
    creators: 18,
    ai_requests: 120,
  },
  creator_pro: {
    ai_requests: 35,
  },
  sponsor_pro: {
    ai_requests: 50,
    campaigns: 5,
  },
};

/** Tighter caps during platform trial — enough to show value, not a free forever ride. */
export function applyPlatformTrialLimits(
  plan: SubscriptionPlan,
  limits: PlanLimits
): PlanLimits {
  const caps = trialUsageCaps[plan.code];
  if (!caps) return limits;

  return {
    creators: capLimit(limits.creators, caps.creators),
    team_members: capLimit(limits.team_members, caps.team_members),
    opportunities: capLimit(limits.opportunities, caps.opportunities),
    campaigns: capLimit(limits.campaigns, caps.campaigns),
    ai_requests: capLimit(limits.ai_requests, caps.ai_requests),
  };
}

function capLimit(
  planLimit: number | null,
  trialCap: number | null | undefined
): number | null {
  if (trialCap === undefined || trialCap === null) return planLimit;
  if (planLimit === null) return trialCap;
  return Math.min(planLimit, trialCap);
}

export function isPlatformTrialActive(
  status: string,
  trialEndsAt: string | null,
  stripeSubscriptionId: string | null
): boolean {
  if (stripeSubscriptionId) return false;
  if (status !== "trialing" || !trialEndsAt) return false;
  return new Date(trialEndsAt) > new Date();
}

export function getTrialDaysRemaining(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function formatTrialCountdown(trialEndsAt: string | null): string | null {
  const days = getTrialDaysRemaining(trialEndsAt);
  if (days === null) return null;
  if (days === 0) return "Trial ends today";
  if (days === 1) return "1 day left in trial";
  return `${days} days left in trial`;
}
