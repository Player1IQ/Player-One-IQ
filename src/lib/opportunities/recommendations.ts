import type { Creator } from "@/lib/creators";
import type { Opportunity } from "@/lib/opportunities";

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
