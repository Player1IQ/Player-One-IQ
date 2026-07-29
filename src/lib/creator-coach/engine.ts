import type { CoachContext, CoachRule, Recommendation, RecommendationPriority } from "./types";
import {
  evaluateClipRepurposeRule,
  evaluateMomentumRule,
  evaluateGoalPersonalizedRule,
  evaluateMissedPostingCadenceRule,
  evaluateOpportunityApplicationsRule,
  evaluateOrgExpiringContractsRule,
  evaluateOrgPendingApplicationsRule,
  evaluateOrgPlatformConnectionsRule,
  evaluateOrgRosterGrowthRule,
  evaluateOverdueDeliverablesRule,
  evaluatePlatformConnectionRule,
  evaluateProfileReadinessRule,
  evaluateRevenueTrackingRule,
  evaluateScheduleRule,
  evaluateSponsorshipReadinessRule,
  evaluateUnreadMessagesRule,
  evaluateUploadConsistencyRule,
} from "./rules";

const PRIORITY_ORDER: Record<RecommendationPriority, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

const creatorRules: CoachRule[] = [
  { id: "overdue-deliverables", evaluate: evaluateOverdueDeliverablesRule },
  { id: "clip-repurpose", evaluate: evaluateClipRepurposeRule },
  { id: "sponsorship-readiness", evaluate: evaluateSponsorshipReadinessRule },
  { id: "goal-personalized", evaluate: evaluateGoalPersonalizedRule },
  { id: "missed-posting-cadence", evaluate: evaluateMissedPostingCadenceRule },
  { id: "upload-consistency", evaluate: evaluateUploadConsistencyRule },
  { id: "momentum", evaluate: evaluateMomentumRule },
  { id: "schedule", evaluate: evaluateScheduleRule },
  { id: "revenue-tracking", evaluate: evaluateRevenueTrackingRule },
  { id: "platform-connection", evaluate: evaluatePlatformConnectionRule },
  { id: "opportunity-applications", evaluate: evaluateOpportunityApplicationsRule },
  { id: "unread-messages", evaluate: evaluateUnreadMessagesRule },
  { id: "profile-readiness", evaluate: evaluateProfileReadinessRule },
];

const organizationRules: CoachRule[] = [
  { id: "org-expiring-contracts", evaluate: evaluateOrgExpiringContractsRule },
  { id: "org-pending-applications", evaluate: evaluateOrgPendingApplicationsRule },
  { id: "org-platform-connections", evaluate: evaluateOrgPlatformConnectionsRule },
  { id: "org-roster-growth", evaluate: evaluateOrgRosterGrowthRule },
  { id: "schedule", evaluate: evaluateScheduleRule },
  { id: "revenue-tracking", evaluate: evaluateRevenueTrackingRule },
  { id: "unread-messages", evaluate: evaluateUnreadMessagesRule },
];

export function getRulesForScope(scope: CoachContext["scope"]): CoachRule[] {
  return scope === "creator" ? creatorRules : organizationRules;
}

export function runRecommendationEngine(
  context: CoachContext,
  options: {
    dismissedIds?: string[];
    completedIds?: string[];
    limit?: number;
  } = {}
): Recommendation[] {
  const dismissed = new Set(options.dismissedIds ?? []);
  const completed = new Set(options.completedIds ?? []);
  const rules = getRulesForScope(context.scope);

  return rules
    .map((rule) => rule.evaluate(context))
    .filter((recommendation): recommendation is Recommendation => {
      if (!recommendation) return false;
      if (dismissed.has(recommendation.id)) return false;
      if (completed.has(recommendation.id)) return false;
      return true;
    })
    .sort(
      (left, right) =>
        PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority] ||
        right.confidenceScore - left.confidenceScore
    )
    .slice(0, options.limit ?? 6);
}

export interface RecommendationEngine {
  generate(
    context: CoachContext,
    dismissedIds?: string[],
    completedIds?: string[]
  ): Recommendation[];
}

export const recommendationEngine: RecommendationEngine = {
  generate(context, dismissedIds, completedIds) {
    return runRecommendationEngine(context, { dismissedIds, completedIds });
  },
};
