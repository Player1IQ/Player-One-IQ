import { analyzePostingCadence } from "@/lib/creator-coach/posting-cadence";
import {
  analyzeStreamTiming,
  formatStreamTimePeaks,
} from "@/lib/creator-coach/stream-timing";
import { fetchCreatorContentSnapshots } from "@/lib/platform-oauth/content-aggregate";
import { getCreatorAudienceAnalytics } from "@/lib/platform-oauth/creator-analytics";
import {
  listCreatorMetricHistory,
  pickGrowthPair,
  weekOverWeekPercent,
} from "@/lib/platform-oauth/metric-history";
import { getOAuthPlatformUi } from "@/lib/platform-oauth/config";
import type { OAuthPlatformUi } from "@/lib/platform-oauth/types";
import { createClient } from "@/lib/supabase/server";
import {
  buildCreatorSnapshotFirstWeekPlan,
  type FirstWeekPlanItem,
} from "./first-week-plan";

export interface SnapshotInsight {
  title: string;
  body: string;
}

export interface SnapshotContentItem {
  id: string;
  title: string;
  platform: string;
  publishedAt: string;
  views: number;
}

export interface CreatorSnapshotView {
  connected: boolean;
  connectedPlatforms: string[];
  primaryPlatform: string | null;
  audienceSize: number | null;
  audienceWowPercent: number | null;
  recentViews: number;
  viewsWowPercent: number | null;
  historyPointCount: number;
  recentContent: SnapshotContentItem[];
  typicalDays: string[];
  cadenceInferred: boolean;
  streamTimesLabel: string | null;
  streamTimesInferred: boolean;
  thinContent: boolean;
  insights: SnapshotInsight[];
  firstWeekPlan: FirstWeekPlanItem[];
  oauthPlatformUi: OAuthPlatformUi[];
}

export function buildSnapshotInsights(input: {
  connected: boolean;
  audienceSize: number | null;
  historyPointCount: number;
  recentViews: number;
  contentCount: number;
  cadenceInferred: boolean;
  typicalDays: string[];
  streamTimesInferred: boolean;
  streamTimesLabel: string | null;
}): SnapshotInsight[] {
  if (!input.connected) {
    return [
      {
        title: "Connect a channel to load real numbers",
        body: "Twitch and Kick are the supported path today. YouTube works for invited Google testers until the app is verified.",
      },
      {
        title: "No invented stats",
        body: "Until an account is connected, audience, views, and best times stay empty. We will not fill them with sample data.",
      },
      {
        title: "Growth needs two history points",
        body: "After you connect, we store audience and view totals daily. Week-over-week change appears on the second capture.",
      },
    ];
  }

  const insights: SnapshotInsight[] = [];

  if (input.audienceSize == null) {
    insights.push({
      title: "Audience is not available yet",
      body: "The connected platform did not return a follower or subscriber count. We leave it blank instead of estimating.",
    });
  } else if (input.historyPointCount < 2) {
    insights.push({
      title: "Current audience is on the board",
      body: "Week-over-week growth stays hidden until we have a second stored snapshot for this channel.",
    });
  }

  if (input.contentCount === 0) {
    insights.push({
      title: "No recent VODs or videos yet",
      body: "Recent performance and best times need public content. Keep streaming or uploading — we will not invent a peak hour.",
    });
  } else if (!input.cadenceInferred) {
    insights.push({
      title: "Not enough posting history for best days",
      body: "We look for about 8 streams or videos in the last eight weeks before calling out typical days.",
    });
  } else {
    insights.push({
      title: "Typical posting days from your VODs",
      body: `You posted most often on ${input.typicalDays.join(", ")}.`,
    });
  }

  if (input.streamTimesInferred && input.streamTimesLabel) {
    insights.push({
      title: "Recent stream times (UTC)",
      body: `Publish timestamps cluster around ${input.streamTimesLabel}. This is history, not a recommendation to change your schedule.`,
    });
  } else if (input.contentCount > 0) {
    insights.push({
      title: "Best times need more samples",
      body: "We need about 8 dated streams or videos before highlighting an hour. Until then this stays empty.",
    });
  }

  return insights.slice(0, 3);
}

export async function loadCreatorSnapshot(
  creatorId: string,
  primaryPlatform: string | null
): Promise<CreatorSnapshotView> {
  const supabase = await createClient();
  const [analytics, snapshots, history] = await Promise.all([
    getCreatorAudienceAnalytics(creatorId).catch(() => null),
    fetchCreatorContentSnapshots(creatorId).catch(() => []),
    listCreatorMetricHistory(creatorId, supabase ?? undefined),
  ]);

  const connectedPlatforms =
    analytics?.platformBreakdown
      .filter((row) => row.connectedViaOAuth)
      .map((row) => row.platform) ?? [];
  const connected = connectedPlatforms.length > 0;
  const audienceSize =
    analytics?.platformBreakdown.reduce<number | null>((sum, row) => {
      if (row.audienceSize == null) return sum;
      return (sum ?? 0) + row.audienceSize;
    }, null) ?? null;
  const recentViews = analytics?.totalViews ?? 0;
  const contentCount = analytics?.totalContent ?? 0;
  const cadence = analyzePostingCadence(snapshots);
  const streamTiming = analyzeStreamTiming(snapshots);
  const streamTimesLabel = streamTiming.inferred
    ? formatStreamTimePeaks(streamTiming.peaks)
    : null;
  const growthPair = pickGrowthPair(history);
  const audienceWowPercent = growthPair
    ? weekOverWeekPercent(
        growthPair.current.audienceSize,
        growthPair.previous.audienceSize
      )
    : null;
  const viewsWowPercent = growthPair
    ? weekOverWeekPercent(
        growthPair.current.viewTotal,
        growthPair.previous.viewTotal
      )
    : null;
  const thinContent = !connected || contentCount < 8 || !cadence.inferred;
  const recentContent = snapshots
    .flatMap((snapshot) =>
      snapshot.items.map((item) => ({
        id: `${snapshot.platform}-${item.id}`,
        title: item.title || "Untitled",
        platform: snapshot.platform,
        publishedAt: item.publishedAt,
        views: item.viewCount,
      }))
    )
    .sort(
      (left, right) =>
        new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime()
    )
    .slice(0, 6);

  const insights = buildSnapshotInsights({
    connected,
    audienceSize,
    historyPointCount: history.length,
    recentViews,
    contentCount,
    cadenceInferred: cadence.inferred,
    typicalDays: cadence.typicalPostingDays,
    streamTimesInferred: streamTiming.inferred,
    streamTimesLabel,
  });

  return {
    connected,
    connectedPlatforms,
    primaryPlatform,
    audienceSize,
    audienceWowPercent,
    recentViews,
    viewsWowPercent,
    historyPointCount: history.length,
    recentContent,
    typicalDays: cadence.typicalPostingDays,
    cadenceInferred: cadence.inferred,
    streamTimesLabel,
    streamTimesInferred: streamTiming.inferred,
    thinContent,
    insights,
    firstWeekPlan: buildCreatorSnapshotFirstWeekPlan({
      connected,
      thinContent,
      cadenceInferred: cadence.inferred,
      typicalDays: cadence.typicalPostingDays,
      streamTimesInferred: streamTiming.inferred,
      streamTimesLabel,
      primaryPlatform,
    }),
    oauthPlatformUi: getOAuthPlatformUi(),
  };
}
