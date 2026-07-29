import type { Contract } from "@/lib/contracts";
import type { Creator } from "@/lib/creators";
import type { CreatorPlatformSummary } from "@/lib/creators/platform-summary";
import type { ProfileReadiness } from "@/lib/creators/portal-benefits";
import type { PortalDeliverableMetrics } from "@/lib/contract-deliverables/queries";
import type { CreatorAudienceAnalytics } from "@/lib/platform-oauth/creator-analytics";
import type { PlatformContentSnapshot } from "@/lib/platform-oauth/content-performance";
import type { DashboardRevenueSummary } from "@/lib/revenue/summary";
import type { ScheduleEvent } from "@/lib/schedule";
import { analyzePostingCadence } from "./posting-cadence";
import { getFirstName } from "./greeting";
import type { CoachProfile } from "./profile-types";
import type { CoachContext } from "./types";

const UPLOAD_GOAL_WEEKLY = 4;
const STREAM_HOURS_ESTIMATE = 2.5;

function deriveContentMetrics(
  analytics: CreatorAudienceAnalytics | null | undefined,
  contentSnapshots: PlatformContentSnapshot[] = []
) {
  const items = contentSnapshots.flatMap((snapshot) => snapshot.items);
  const streamCount = items.filter((item) => item.contentType === "stream").length;
  const clipCount = items.filter((item) => item.contentType === "clip").length;
  const videoCount = items.filter((item) => item.contentType === "video").length;
  const uploadsCompleted = analytics?.totalContent ?? items.length;
  const streamedHours = Math.round(streamCount * STREAM_HOURS_ESTIMATE);

  const totalViews = analytics?.totalViews ?? items.reduce((sum, item) => sum + item.viewCount, 0);
  const totalEngagement =
    analytics?.platformBreakdown.reduce(
      (sum, platform) => sum + platform.totalEngagement,
      0
    ) ??
    items.reduce(
      (sum, item) => sum + (item.likeCount ?? 0) + (item.commentCount ?? 0),
      0
    );
  const engagementRate =
    totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;

  return {
    streamedHours,
    clipsCreated: clipCount,
    streamCount,
    videoCount,
    uploadsCompleted,
    engagementRate: Math.round(engagementRate * 10) / 10,
  };
}

export function buildCreatorCoachContext(input: {
  creator: Creator;
  contracts: Contract[];
  platformSummary: CreatorPlatformSummary | null;
  deliverableMetrics: PortalDeliverableMetrics;
  profileReadiness: ProfileReadiness | null;
  hasScheduleBlock: boolean;
  todayScheduleCount: number;
  unreadMessages: number;
  openOpportunityCount: number;
  pendingApplicationCount: number;
  revenueEntryCount: number;
  analytics?: CreatorAudienceAnalytics | null;
  contentSnapshots?: PlatformContentSnapshot[];
  coachProfile?: CoachProfile | null;
}): CoachContext {
  const creatorContracts = input.contracts.filter(
    (contract) => contract.creatorId === input.creator.id
  );
  const activeContracts = creatorContracts.filter((contract) =>
    ["active", "negotiating"].includes(contract.status)
  );
  const contentMetrics = deriveContentMetrics(
    input.analytics,
    input.contentSnapshots ?? []
  );
  const postingCadence = analyzePostingCadence(input.contentSnapshots ?? [], {
    manualPostingDays: input.coachProfile?.targetPostingDays,
  });
  const connectedCount = input.platformSummary?.connectedCount ?? 0;
  const hasRevenueData =
    input.revenueEntryCount > 0 || connectedCount > 0;

  return {
    scope: "creator",
    scopeId: input.creator.id,
    firstName: getFirstName(input.creator.name),
    creatorName: input.creator.name,
    primaryPlatform: input.creator.primaryPlatform,
    connectedPlatformCount: connectedCount,
    hasOAuthContent: input.platformSummary?.hasOAuthContent ?? false,
    totalRecentViews: input.platformSummary?.totalRecentViews ?? null,
    totalAudience: input.platformSummary?.totalAudience ?? null,
    streamedHours: contentMetrics.streamedHours,
    clipsCreated: contentMetrics.clipsCreated,
    streamCount: contentMetrics.streamCount,
    videoCount: contentMetrics.videoCount,
    engagementRate: contentMetrics.engagementRate,
    uploadsCompleted: contentMetrics.uploadsCompleted,
    uploadGoal: UPLOAD_GOAL_WEEKLY,
    sponsorDeals: activeContracts.length,
    activeContracts: activeContracts.length,
    followersGrowth: null,
    streamScheduleMissing: !input.hasScheduleBlock,
    noRevenueTracking: !hasRevenueData,
    openDeliverables: input.deliverableMetrics.openCount,
    overdueDeliverables: input.deliverableMetrics.overdueCount,
    profileReadinessScore: input.profileReadiness?.score ?? 0,
    profileReadinessItems: input.profileReadiness?.items ?? [],
    openOpportunities: input.openOpportunityCount,
    pendingApplications: input.pendingApplicationCount,
    todayScheduleCount: input.todayScheduleCount,
    unreadMessages: input.unreadMessages,
    postingCadence,
    coachProfile: input.coachProfile ?? null,
  };
}

export function buildOrganizationCoachContext(input: {
  userDisplayName: string;
  creators: Creator[];
  contracts: Contract[];
  connectedAccountCount: number;
  monthlyRevenue: DashboardRevenueSummary;
  openOpportunityCount: number;
  pendingApplications: number;
  todaySchedule: ScheduleEvent[];
  unreadMessages: number;
  expiringContractsCount: number;
}): CoachContext {
  const activeCreators = input.creators.filter(
    (creator) => creator.status === "active"
  );
  const activeContracts = input.contracts.filter((contract) =>
    ["active", "negotiating"].includes(contract.status)
  );

  return {
    scope: "organization",
    scopeId: null,
    firstName: getFirstName(input.userDisplayName),
    connectedPlatformCount: input.connectedAccountCount,
    hasOAuthContent: input.connectedAccountCount > 0,
    totalRecentViews: null,
    totalAudience: null,
    streamedHours: 0,
    clipsCreated: 0,
    streamCount: 0,
    videoCount: 0,
    engagementRate: 0,
    uploadsCompleted: 0,
    uploadGoal: UPLOAD_GOAL_WEEKLY,
    sponsorDeals: activeContracts.length,
    activeContracts: activeContracts.length,
    followersGrowth: null,
    streamScheduleMissing: input.todaySchedule.length === 0,
    noRevenueTracking:
      input.monthlyRevenue.connectedAccountCount === 0 &&
      input.monthlyRevenue.contractRevenue === 0,
    openDeliverables: 0,
    overdueDeliverables: 0,
    profileReadinessScore: activeCreators.length > 0 ? 75 : 25,
    profileReadinessItems: [],
    openOpportunities: input.openOpportunityCount,
    pendingApplications: input.pendingApplications,
    todayScheduleCount: input.todaySchedule.length,
    unreadMessages: input.unreadMessages,
    postingCadence: null,
    activeCreatorsCount: activeCreators.length,
    expiringContractsCount: input.expiringContractsCount,
    platformRevenueDisplay: input.monthlyRevenue.platformRevenueDisplay,
  };
}
