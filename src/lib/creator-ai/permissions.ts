import {
  getCurrentUserMembership,
  getLinkedCreatorId,
} from "@/lib/permissions";
import { isCreatorPortalRole } from "@/lib/team";
import {
  getLimitForMetric,
  hasFeature,
  isWithinLimit,
} from "@/lib/subscription/features";
import { getSubscriptionContext } from "@/lib/subscription/queries";
import { getUsageMetricCount } from "@/lib/subscription/usage";
import { getCurrentUserId } from "@/lib/creator-coach/service";

export const CREATOR_AI_COACH_FEATURE = "ai_creator_coach" as const;

export async function requireCreatorAiCoachAccess(): Promise<
  | {
      userId: string;
      creatorId: string;
      organizationId: string;
    }
  | { error: string; upgradeRequired?: boolean }
> {
  const membership = await getCurrentUserMembership();
  if (!membership || !isCreatorPortalRole(membership.role)) {
    return { error: "Creator portal access required." };
  }

  const linkedCreatorId = membership.linkedCreatorId ?? (await getLinkedCreatorId());
  if (!linkedCreatorId) {
    return { error: "Link a creator profile to use AI Coach chat." };
  }

  const [userId, context, aiRequestCount] = await Promise.all([
    getCurrentUserId(),
    getSubscriptionContext(),
    getUsageMetricCount("ai_requests"),
  ]);

  if (!userId) {
    return { error: "You must be signed in." };
  }

  if (!hasFeature(context.features, CREATOR_AI_COACH_FEATURE)) {
    return {
      error:
        "AI Creator Coach chat is not included in your current plan. Upgrade to unlock this feature.",
      upgradeRequired: true,
    };
  }

  const limit = getLimitForMetric(context.limits, "ai_requests");
  if (!isWithinLimit(aiRequestCount, limit)) {
    return {
      error: `Your plan allows up to ${limit} AI requests this month. Upgrade to add more.`,
      upgradeRequired: true,
    };
  }

  const organizationId = context.subscription?.organizationId;
  if (!organizationId) {
    return { error: "Organization not found." };
  }

  return {
    userId,
    creatorId: linkedCreatorId,
    organizationId,
  };
}
