import type { Creator } from "../creators/types";
import type { Opportunity } from "./types";

export type OpportunityFitLevel = "great" | "good" | "fair";

export function getOpportunityFitScore(
  opportunity: Opportunity,
  creator: Creator
): number {
  return recommendationScore(opportunity, creator);
}

export function getOpportunityFitLevel(
  opportunity: Opportunity,
  creator: Creator
): OpportunityFitLevel {
  const score = recommendationScore(opportunity, creator);
  if (score >= 5) return "great";
  if (score >= 3) return "good";
  return "fair";
}

export const opportunityFitLabels: Record<OpportunityFitLevel, string> = {
  great: "Great fit",
  good: "Good fit",
  fair: "Fair fit",
};

function recommendationScore(
  opportunity: Opportunity,
  creator: Creator
): number {
  let score = 0;

  if (opportunity.platform === creator.primaryPlatform) {
    score += 3;
  }

  if (
    creator.socialHandles.some((handle) => handle.platform === opportunity.platform)
  ) {
    score += 2;
  }

  if (opportunity.marketplaceListing) {
    score += 1;
  }

  if (opportunity.budget !== null && opportunity.budget > 0) {
    score += 1;
  }

  return score;
}

export function getRecommendedOpportunitiesForCreator(
  opportunities: Opportunity[],
  appliedOpportunityIds: Set<string>,
  creator: Creator,
  limit = 5
): Opportunity[] {
  return opportunities
    .filter(
      (opportunity) =>
        opportunity.status === "open" && !appliedOpportunityIds.has(opportunity.id)
    )
    .map((opportunity) => ({
      opportunity,
      score: recommendationScore(opportunity, creator),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return (
        new Date(right.opportunity.createdAt).getTime() -
        new Date(left.opportunity.createdAt).getTime()
      );
    })
    .slice(0, limit)
    .map((entry) => entry.opportunity);
}
