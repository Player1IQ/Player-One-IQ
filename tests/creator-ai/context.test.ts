import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildCreatorAiContext,
  contextPromptExcludesRevenueDollars,
  serializeCreatorAiContextForPrompt,
} from "@/lib/creator-ai/context";
import {
  CREATOR_AI_RETENTION_DAYS,
  creatorAiRetentionCutoff,
  isWithinCreatorAiRetention,
} from "@/lib/creator-ai/types";
import type { CoachContext, Recommendation } from "@/lib/creator-coach/types";
import type { CoachProfile } from "@/lib/creator-coach/profile-types";
import type { CreatorAudienceAnalytics } from "@/lib/platform-oauth/creator-analytics";
import type { PlatformContentSnapshot } from "@/lib/platform-oauth/content-performance";

function baseCoachContext(overrides: Partial<CoachContext> = {}): CoachContext {
  return {
    scope: "creator",
    scopeId: "creator-1",
    displayName: "Alex Creator",
    creatorName: "Alex Creator",
    primaryPlatform: "YouTube",
    connectedPlatformCount: 2,
    hasOAuthContent: true,
    totalRecentViews: 12500,
    totalAudience: 8000,
    streamedHours: 6,
    clipsCreated: 4,
    streamCount: 2,
    videoCount: 8,
    engagementRate: 4.2,
    uploadsCompleted: 10,
    uploadGoal: 4,
    sponsorDeals: 1,
    activeContracts: 1,
    followersGrowth: null,
    streamScheduleMissing: false,
    noRevenueTracking: false,
    openDeliverables: 0,
    overdueDeliverables: 0,
    profileReadinessScore: 82,
    profileReadinessItems: [],
    openOpportunities: 3,
    pendingApplications: 1,
    todayScheduleCount: 1,
    unreadMessages: 0,
    postingCadence: {
      inferred: true,
      typicalPostingDays: ["Tuesday", "Thursday"],
      missedDaysThisWeek: ["Tuesday"],
      postsLast30Days: 8,
      avgPostsPerWeek: 2,
      consistencyScore: 72,
    },
    ...overrides,
  };
}

const coachProfile: CoachProfile = {
  id: "profile-1",
  activated: true,
  onboardingCompleted: true,
  primaryGoal: "growth",
  contentFocus: ["Long-form video", "Short-form clips"],
  targetPostingDays: ["Tuesday", "Thursday"],
  monetizationInterests: ["Brand partnerships"],
  biggestChallenge: "Staying consistent",
};

const recommendations: Recommendation[] = [
  {
    id: "rec-1",
    title: "Repurpose your top stream",
    description: "Turn highlights into short clips.",
    whyItMatters: "Clips drive discovery.",
    category: "Content",
    priority: "High",
    estimatedImpact: "Medium",
    confidenceScore: 80,
    actionLabel: "View content",
    actionRoute: "/portal/growth",
    dismissible: true,
    completed: false,
    dateGenerated: "2026-08-01T00:00:00.000Z",
  },
];

const analytics: CreatorAudienceAnalytics = {
  platformBreakdown: [
    {
      platform: "YouTube",
      contentCount: 8,
      totalViews: 10000,
      avgViews: 1250,
      totalEngagement: 420,
      audienceSize: 5000,
      connectedViaOAuth: true,
    },
  ],
  contentTrend: [],
  weeklyViewsTrend: [
    {
      weekStart: "2026-07-28",
      label: "Jul 28",
      views: 2400,
      contentCount: 2,
    },
  ],
  totalViews: 10000,
  totalContent: 8,
  hasOAuthContent: true,
  connectedOAuthCount: 1,
};

const contentSnapshots: PlatformContentSnapshot[] = [
  {
    platform: "YouTube",
    connectedViaOAuth: true,
    items: Array.from({ length: 14 }, (_, index) => ({
      id: `vid-${index + 1}`,
      title: `Video ${index + 1}`,
      publishedAt: new Date(Date.UTC(2026, 6, 30 - index)).toISOString(),
      contentType: "video" as const,
      viewCount: 500 + index * 10,
      likeCount: 20,
      commentCount: 5,
    })),
  },
];

test("context excludes revenue dollar amounts from serialized prompt", () => {
  const context = buildCreatorAiContext({
    coachContext: baseCoachContext({
      platformRevenueDisplay: "$12,450 this month",
    }),
    coachProfile,
    analytics,
    contentSnapshots,
    recommendations,
  });

  const serialized = serializeCreatorAiContextForPrompt(context);

  assert.equal(contextPromptExcludesRevenueDollars(serialized), true);
  assert.doesNotMatch(serialized, /\$\d/);
  assert.doesNotMatch(serialized, /platformRevenueDisplay/);
});

test("context includes coach profile and posting cadence", () => {
  const context = buildCreatorAiContext({
    coachContext: baseCoachContext(),
    coachProfile,
    analytics,
    contentSnapshots,
    recommendations,
  });

  assert.equal(context.coachProfile?.primaryGoal, "growth");
  assert.deepEqual(context.postingCadence?.typicalPostingDays, [
    "Tuesday",
    "Thursday",
  ]);
  assert.equal(context.displayName, "Alex Creator");
});

test("context includes recent recommendation ids and titles", () => {
  const context = buildCreatorAiContext({
    coachContext: baseCoachContext(),
    coachProfile,
    recommendations,
  });

  assert.equal(context.recentRecommendations.length, 1);
  assert.equal(context.recentRecommendations[0]?.id, "rec-1");
  assert.equal(context.recentRecommendations[0]?.title, "Repurpose your top stream");
});

test("context limits recent content to 12 items per platform", () => {
  const context = buildCreatorAiContext({
    coachContext: baseCoachContext(),
    contentSnapshots,
  });

  assert.equal(context.recentContentByPlatform.YouTube?.length, 12);
});

test("30-day retention helpers filter old conversations", () => {
  assert.equal(CREATOR_AI_RETENTION_DAYS, 30);

  const cutoff = creatorAiRetentionCutoff();
  const recent = new Date(cutoff.getTime() + 60_000).toISOString();
  const stale = new Date(cutoff.getTime() - 60_000).toISOString();

  assert.equal(isWithinCreatorAiRetention(recent), true);
  assert.equal(isWithinCreatorAiRetention(stale), false);
});
