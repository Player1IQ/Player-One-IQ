import type { CoachContext, Recommendation } from "@/lib/creator-coach/types";
import type { CoachProfile } from "@/lib/creator-coach/profile-types";
import type { CreatorAudienceAnalytics } from "@/lib/platform-oauth/creator-analytics";
import type { PlatformContentSnapshot } from "@/lib/platform-oauth/content-performance";
import type { CreatorAiContext } from "./types";
import { summarizeRecommendations } from "./types";

const CONTENT_ITEMS_PER_PLATFORM = 12;

function stripRevenueFields(
  context: CoachContext
): Omit<CoachContext, "platformRevenueDisplay"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- intentionally omitted from AI context
  const { platformRevenueDisplay, ...safe } = context;
  return safe;
}

function buildRecentContentByPlatform(
  snapshots: PlatformContentSnapshot[]
): CreatorAiContext["recentContentByPlatform"] {
  const result: CreatorAiContext["recentContentByPlatform"] = {};

  for (const snapshot of snapshots) {
    result[snapshot.platform] = snapshot.items
      .slice()
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      )
      .slice(0, CONTENT_ITEMS_PER_PLATFORM)
      .map((item) => ({
        id: item.id,
        title: item.title,
        platform: snapshot.platform,
        contentType: item.contentType,
        viewCount: item.viewCount,
        publishedAt: item.publishedAt,
      }));
  }

  return result;
}

export function buildCreatorAiContext(input: {
  coachContext: CoachContext;
  coachProfile?: CoachProfile | null;
  analytics?: CreatorAudienceAnalytics | null;
  contentSnapshots?: PlatformContentSnapshot[];
  recommendations?: Recommendation[];
}): CreatorAiContext {
  const safeContext = stripRevenueFields(input.coachContext);
  const analytics = input.analytics ?? null;
  const snapshots = input.contentSnapshots ?? [];

  return {
    displayName: safeContext.displayName,
    primaryPlatform: safeContext.primaryPlatform ?? null,
    connectedPlatformCount: safeContext.connectedPlatformCount,
    hasOAuthContent: safeContext.hasOAuthContent,
    totalRecentViews: safeContext.totalRecentViews,
    totalAudience: safeContext.totalAudience,
    engagementRate: safeContext.engagementRate,
    uploadsCompleted: safeContext.uploadsCompleted,
    uploadGoal: safeContext.uploadGoal,
    sponsorDeals: safeContext.sponsorDeals,
    activeContracts: safeContext.activeContracts,
    openDeliverables: safeContext.openDeliverables,
    overdueDeliverables: safeContext.overdueDeliverables,
    profileReadinessScore: safeContext.profileReadinessScore,
    openOpportunities: safeContext.openOpportunities,
    pendingApplications: safeContext.pendingApplications,
    streamScheduleMissing: safeContext.streamScheduleMissing,
    noRevenueTracking: safeContext.noRevenueTracking,
    postingCadence: safeContext.postingCadence ?? null,
    coachProfile: input.coachProfile ?? safeContext.coachProfile ?? null,
    platformBreakdown:
      analytics?.platformBreakdown.map((row) => ({
        platform: row.platform,
        contentCount: row.contentCount,
        totalViews: row.totalViews,
        avgViews: row.avgViews,
        totalEngagement: row.totalEngagement,
        audienceSize: row.audienceSize,
      })) ?? [],
    weeklyViewsTrend:
      analytics?.weeklyViewsTrend.map((row) => ({
        weekStart: row.weekStart,
        label: row.label,
        views: row.views,
        contentCount: row.contentCount,
      })) ?? [],
    recentContentByPlatform: buildRecentContentByPlatform(snapshots),
    recentRecommendations: summarizeRecommendations(input.recommendations ?? []),
  };
}

export function serializeCreatorAiContextForPrompt(
  context: CreatorAiContext
): string {
  const payload = {
    creator: {
      displayName: context.displayName,
      primaryPlatform: context.primaryPlatform,
      connectedPlatformCount: context.connectedPlatformCount,
      hasOAuthContent: context.hasOAuthContent,
      totalRecentViews: context.totalRecentViews,
      totalAudience: context.totalAudience,
      engagementRate: context.engagementRate,
      uploadsCompleted: context.uploadsCompleted,
      uploadGoal: context.uploadGoal,
      sponsorDeals: context.sponsorDeals,
      activeContracts: context.activeContracts,
      openDeliverables: context.openDeliverables,
      overdueDeliverables: context.overdueDeliverables,
      profileReadinessScore: context.profileReadinessScore,
      openOpportunities: context.openOpportunities,
      pendingApplications: context.pendingApplications,
      streamScheduleMissing: context.streamScheduleMissing,
      hasRevenueTrackingSetup: !context.noRevenueTracking,
      postingCadence: context.postingCadence,
    },
    coachProfile: context.coachProfile
      ? {
          primaryGoal: context.coachProfile.primaryGoal,
          contentFocus: context.coachProfile.contentFocus,
          targetPostingDays: context.coachProfile.targetPostingDays,
          monetizationInterests: context.coachProfile.monetizationInterests,
          biggestChallenge: context.coachProfile.biggestChallenge,
        }
      : null,
    analytics: {
      platformBreakdown: context.platformBreakdown,
      weeklyViewsTrend: context.weeklyViewsTrend,
    },
    recentContentByPlatform: context.recentContentByPlatform,
    recentRecommendations: context.recentRecommendations,
  };

  return JSON.stringify(payload, null, 2);
}

/** Guard against leaking dollar amounts into prompts */
export function contextPromptExcludesRevenueDollars(serialized: string): boolean {
  return !/\$\d/.test(serialized) && !/"projectedAmount"/.test(serialized);
}
