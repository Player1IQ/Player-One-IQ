import type { Creator } from "./types";
import type { Contract } from "@/lib/contracts";
import type { CreatorRevenueEntry } from "@/lib/creator-revenue";
import type { PortalDeliverableMetrics } from "@/lib/contract-deliverables/queries";
import {
  getApplicationStats,
  type Opportunity,
  type OpportunityApplication,
} from "@/lib/opportunities";
import {
  getDashboardRevenueSummary,
  type DashboardRevenueSummary,
} from "@/lib/revenue/summary";
import { getMarketplaceOpportunities } from "@/lib/opportunities/queries";
import { getRecommendedOpportunitiesForCreator } from "@/lib/opportunities/recommendations";

export interface ProfileReadinessItem {
  id: string;
  label: string;
  done: boolean;
  href: string;
}

export interface ProfileReadiness {
  score: number;
  items: ProfileReadinessItem[];
}

export interface CreatorPortalBenefits {
  revenueSummary: DashboardRevenueSummary;
  applicationStats: ReturnType<typeof getApplicationStats>;
  recentApplications: OpportunityApplication[];
  marketplaceOpportunities: Opportunity[];
  marketplaceCount: number;
  recommendedOpportunities: Opportunity[];
  profileReadiness: ProfileReadiness;
}

export interface ComputeProfileReadinessInput {
  creatorId: string;
  creator: Creator;
  connectedPlatformCount: number;
  applicationCount: number;
  openDeliverableCount: number;
  marketplaceCount: number;
}

export function computeProfileReadiness({
  creatorId,
  creator,
  connectedPlatformCount,
  applicationCount,
  openDeliverableCount,
  marketplaceCount,
}: ComputeProfileReadinessInput): ProfileReadiness {
  const profileHref = `/creators/${creatorId}`;
  const hasContactInfo =
    Boolean(creator.email?.trim()) || creator.socialHandles.length > 0;

  const items: ProfileReadinessItem[] = [
    {
      id: "connect_platform",
      label: "Connect a platform",
      done: connectedPlatformCount > 0,
      href: profileHref,
    },
    {
      id: "profile_contact",
      label: "Add social handles or email on profile",
      done: hasContactInfo,
      href: profileHref,
    },
    {
      id: "browse_marketplace",
      label: "Browse the open marketplace",
      done: applicationCount > 0 || marketplaceCount === 0,
      href: "/opportunities?tab=marketplace",
    },
  ];

  if (openDeliverableCount > 0) {
    items.push({
      id: "complete_deliverable",
      label: "Complete an active deliverable",
      done: false,
      href: "/contracts",
    });
  }

  const doneCount = items.filter((item) => item.done).length;
  const score =
    items.length === 0 ? 100 : Math.round((doneCount / items.length) * 100);

  return { score, items };
}

export async function getCreatorPortalBenefits(
  creatorId: string,
  creator: Creator,
  contracts: Contract[],
  revenueEntries: CreatorRevenueEntry[],
  connectedAccountCount: number,
  applications: OpportunityApplication[],
  deliverableMetrics: PortalDeliverableMetrics,
  marketplaceOpportunities?: Opportunity[],
  openOpportunities?: Opportunity[]
): Promise<CreatorPortalBenefits> {
  const creatorContracts = contracts.filter(
    (contract) => contract.creatorId === creatorId
  );
  const marketplace =
    marketplaceOpportunities ?? (await getMarketplaceOpportunities());
  const applicationStats = getApplicationStats(applications);
  const appliedOpportunityIds = new Set(applications.map((app) => app.opportunityId));
  const recommendationPool = openOpportunities ?? marketplace;
  const recentApplications = [...applications]
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    )
    .slice(0, 5);

  return {
    revenueSummary: getDashboardRevenueSummary(
      creatorContracts,
      revenueEntries,
      connectedAccountCount
    ),
    applicationStats,
    recentApplications,
    marketplaceOpportunities: marketplace.slice(0, 3),
    marketplaceCount: marketplace.length,
    recommendedOpportunities: getRecommendedOpportunitiesForCreator(
      recommendationPool,
      appliedOpportunityIds,
      creator,
      5
    ),
    profileReadiness: computeProfileReadiness({
      creatorId,
      creator,
      connectedPlatformCount: connectedAccountCount,
      applicationCount: applicationStats.total,
      openDeliverableCount: deliverableMetrics.openCount,
      marketplaceCount: marketplace.length,
    }),
  };
}
