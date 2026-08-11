import { getContracts } from "@/lib/contracts/queries";
import { getCreatorPlatformAccounts, getCreatorRevenueEntries } from "@/lib/creator-revenue/queries";
import { isConnectedPlatformAccount } from "@/lib/creator-revenue";
import { getCreatorById } from "@/lib/creators/queries";
import { getCreatorPortalBenefits } from "@/lib/creators/portal-benefits";
import { getCreatorPlatformSummary } from "@/lib/creators/platform-summary";
import {
  buildCreatorCoachContext,
  buildCreatorCoachSnapshot,
  getCurrentUserId,
} from "@/lib/creator-coach";
import { getCoachProfile } from "@/lib/creator-coach/profile-queries";
import {
  getPortalDeliverableMetrics,
} from "@/lib/contract-deliverables/queries";
import { getUnreadMessageCount } from "@/lib/messages/queries";
import {
  getApplicationsForCreator,
  getMarketplaceOpportunities,
  getOpenOpportunitiesForPortal,
} from "@/lib/opportunities/queries";
import { getApplicationStats } from "@/lib/opportunities";
import { getCreatorAudienceAnalytics } from "@/lib/platform-oauth/creator-analytics";
import { fetchCreatorContentSnapshots } from "@/lib/platform-oauth/content-aggregate";
import { creatorHasScheduleBlocks, getTodayScheduleEvents } from "@/lib/schedule/queries";
import type { CoachContext, CreatorCoachSnapshot } from "@/lib/creator-coach/types";
import type { CoachProfile } from "@/lib/creator-coach/profile-types";
import type { Creator } from "@/lib/creators";
import type { CreatorAudienceAnalytics } from "@/lib/platform-oauth/creator-analytics";
import type { PlatformContentSnapshot } from "@/lib/platform-oauth/content-performance";

export interface PortalCoachPageData {
  creator: Creator;
  coachSnapshot: CreatorCoachSnapshot | null;
  coachContext: CoachContext;
  coachProfile: CoachProfile | null;
  creatorId: string;
  audienceAnalytics: CreatorAudienceAnalytics | null;
  contentSnapshots: PlatformContentSnapshot[];
}

export async function loadPortalCoachPageData(
  linkedCreatorId: string
): Promise<PortalCoachPageData | null> {
  const [
    creator,
    contracts,
    unreadMessages,
    deliverableMetrics,
    openOpportunities,
    opportunityApplications,
    platformSummary,
    revenueEntries,
    platformAccounts,
    marketplaceOpportunities,
    todaySchedule,
    hasScheduleBlock,
    audienceAnalytics,
    contentSnapshots,
    userId,
    coachProfile,
  ] = await Promise.all([
    getCreatorById(linkedCreatorId),
    getContracts(),
    getUnreadMessageCount(),
    getPortalDeliverableMetrics(linkedCreatorId),
    getOpenOpportunitiesForPortal(),
    getApplicationsForCreator(linkedCreatorId),
    getCreatorPlatformSummary(linkedCreatorId),
    getCreatorRevenueEntries(linkedCreatorId),
    getCreatorPlatformAccounts(linkedCreatorId),
    getMarketplaceOpportunities(),
    getTodayScheduleEvents(),
    creatorHasScheduleBlocks(linkedCreatorId),
    getCreatorAudienceAnalytics(linkedCreatorId).catch(() => null),
    fetchCreatorContentSnapshots(linkedCreatorId).catch(() => []),
    getCurrentUserId(),
    getCurrentUserId().then((id) =>
      id ? getCoachProfile(id, linkedCreatorId) : Promise.resolve(null)
    ),
  ]);

  if (!creator) return null;

  const opportunityApplicationStats = getApplicationStats(opportunityApplications);
  const portalBenefits = await getCreatorPortalBenefits(
    linkedCreatorId,
    creator,
    contracts,
    revenueEntries,
    platformAccounts.filter(isConnectedPlatformAccount).length,
    opportunityApplications,
    deliverableMetrics,
    marketplaceOpportunities,
    openOpportunities,
    hasScheduleBlock
  );

  const coachContext = buildCreatorCoachContext({
    creator,
    contracts,
    platformSummary,
    deliverableMetrics,
    profileReadiness: portalBenefits.profileReadiness,
    hasScheduleBlock,
    todayScheduleCount: todaySchedule.length,
    unreadMessages,
    openOpportunityCount: openOpportunities.length,
    pendingApplicationCount: opportunityApplicationStats.needsAction,
    revenueEntryCount: revenueEntries.length,
    analytics: audienceAnalytics,
    contentSnapshots,
    coachProfile,
  });

  let coachSnapshot: CreatorCoachSnapshot | null = null;
  if (userId) {
    try {
      coachSnapshot = await buildCreatorCoachSnapshot({
        userId,
        creatorCoachContext: coachContext,
      });
    } catch {
      coachSnapshot = null;
    }
  }

  return {
    creator,
    coachSnapshot,
    coachContext,
    coachProfile,
    creatorId: linkedCreatorId,
    audienceAnalytics: audienceAnalytics ?? null,
    contentSnapshots,
  };
}
