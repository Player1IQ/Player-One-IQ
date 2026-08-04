import { getOAuthAccessTokenForCreator, getConnectedOAuthPlatformsForCreator } from "./account-access";
import {
  fetchCreatorContentSnapshots,
  getAnalyzablePlatforms,
} from "./content-aggregate";
import type { PlatformContentSnapshot } from "./content-performance";
import type { OAuthPlatform } from "./types";

export interface PlatformBreakdownMetric {
  platform: string;
  contentCount: number;
  totalViews: number;
  avgViews: number;
  totalEngagement: number;
  audienceSize: number | null;
  connectedViaOAuth: boolean;
}

export interface ContentTrendPoint {
  id: string;
  label: string;
  views: number;
  engagement: number;
  platform: string;
  publishedAt: string;
}

export interface WeeklyViewsPoint {
  weekStart: string;
  label: string;
  views: number;
  contentCount: number;
}

export interface CreatorAudienceAnalytics {
  platformBreakdown: PlatformBreakdownMetric[];
  contentTrend: ContentTrendPoint[];
  weeklyViewsTrend: WeeklyViewsPoint[];
  totalViews: number;
  totalContent: number;
  hasOAuthContent: boolean;
  connectedOAuthCount: number;
}

function engagementForItem(item: {
  likeCount?: number;
  commentCount?: number;
}): number {
  return (item.likeCount ?? 0) + (item.commentCount ?? 0);
}

function buildBreakdownFromSnapshots(
  snapshots: PlatformContentSnapshot[],
  audienceSizes: Map<string, number | null>
): PlatformBreakdownMetric[] {
  return snapshots.map((snapshot) => {
    const totalViews = snapshot.items.reduce(
      (sum, item) => sum + item.viewCount,
      0
    );
    const totalEngagement = snapshot.items.reduce(
      (sum, item) => sum + engagementForItem(item),
      0
    );
    const contentCount = snapshot.items.length;

    return {
      platform: snapshot.platform,
      contentCount,
      totalViews,
      avgViews: contentCount > 0 ? Math.round(totalViews / contentCount) : 0,
      totalEngagement,
      audienceSize: audienceSizes.get(snapshot.platform) ?? null,
      connectedViaOAuth: snapshot.connectedViaOAuth,
    };
  });
}

function getWeekStartUtc(isoDate: string): string | null {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;

  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

function formatWeekLabel(weekStart: string): string {
  const date = new Date(`${weekStart}T00:00:00.000Z`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

const WEEKLY_TREND_LOOKBACK_WEEKS = 12;

function getWeekStartsForLookback(now = new Date()): string[] {
  const currentWeekStart = getWeekStartUtc(now.toISOString());
  if (!currentWeekStart) return [];

  const weekStarts: string[] = [];
  const anchor = new Date(`${currentWeekStart}T00:00:00.000Z`);

  for (let index = WEEKLY_TREND_LOOKBACK_WEEKS - 1; index >= 0; index -= 1) {
    const weekDate = new Date(anchor);
    weekDate.setUTCDate(anchor.getUTCDate() - index * 7);
    weekStarts.push(weekDate.toISOString().slice(0, 10));
  }

  return weekStarts;
}

function getWeekStartsBetween(startDate: Date, endWeekStart: string): string[] {
  const startWeek = getWeekStartUtc(startDate.toISOString());
  if (!startWeek) return [];

  const weekStarts: string[] = [];
  const anchor = new Date(`${startWeek}T00:00:00.000Z`);
  const end = new Date(`${endWeekStart}T00:00:00.000Z`);

  while (anchor <= end) {
    weekStarts.push(anchor.toISOString().slice(0, 10));
    anchor.setUTCDate(anchor.getUTCDate() + 7);
  }

  return weekStarts;
}

export function buildWeeklyViewsTrend(
  points: ContentTrendPoint[],
  now = new Date()
): WeeklyViewsPoint[] {
  const defaultWindowStart = new Date(now);
  defaultWindowStart.setUTCDate(
    defaultWindowStart.getUTCDate() - WEEKLY_TREND_LOOKBACK_WEEKS * 7
  );
  defaultWindowStart.setUTCHours(0, 0, 0, 0);

  const validPoints = points.filter((point) => {
    const published = new Date(point.publishedAt);
    return !Number.isNaN(published.getTime());
  });

  const hasRecentContent = validPoints.some(
    (point) => new Date(point.publishedAt) >= defaultWindowStart
  );

  let weekStarts: string[];
  let windowStart: Date;

  if (hasRecentContent || validPoints.length === 0) {
    weekStarts = getWeekStartsForLookback(now);
    windowStart = defaultWindowStart;
  } else {
    const earliest = validPoints.reduce((min, point) => {
      const published = new Date(point.publishedAt);
      return published < min ? published : min;
    }, new Date(validPoints[0].publishedAt));

    const currentWeekStart = getWeekStartUtc(now.toISOString());
    if (!currentWeekStart) {
      weekStarts = getWeekStartsForLookback(now);
      windowStart = defaultWindowStart;
    } else {
      const earliestWeekStart = getWeekStartUtc(earliest.toISOString());
      windowStart = earliestWeekStart
        ? new Date(`${earliestWeekStart}T00:00:00.000Z`)
        : earliest;
      weekStarts = getWeekStartsBetween(windowStart, currentWeekStart);
    }
  }

  const buckets = new Map(
    weekStarts.map((weekStart) => [
      weekStart,
      { views: 0, contentCount: 0 },
    ])
  );

  for (const point of validPoints) {
    const published = new Date(point.publishedAt);
    if (published < windowStart) {
      continue;
    }

    const weekStart = getWeekStartUtc(point.publishedAt);
    if (!weekStart || !buckets.has(weekStart)) continue;

    const existing = buckets.get(weekStart)!;
    buckets.set(weekStart, {
      views: existing.views + point.views,
      contentCount: existing.contentCount + 1,
    });
  }

  return weekStarts.map((weekStart) => {
    const bucket = buckets.get(weekStart)!;
    return {
      weekStart,
      label: formatWeekLabel(weekStart),
      views: bucket.views,
      contentCount: bucket.contentCount,
    };
  });
}

function buildContentTrendPoints(
  snapshots: PlatformContentSnapshot[]
): ContentTrendPoint[] {
  const points: ContentTrendPoint[] = [];

  for (const snapshot of snapshots) {
    for (const item of snapshot.items) {
      points.push({
        id: `${snapshot.platform}-${item.id}`,
        label: (item.title || "Untitled").trim(),
        views: item.viewCount,
        engagement: engagementForItem(item),
        platform: snapshot.platform,
        publishedAt: item.publishedAt,
      });
    }
  }

  return points.sort(
    (left, right) =>
      new Date(left.publishedAt).getTime() - new Date(right.publishedAt).getTime()
  );
}

async function fetchPlatformAudienceSize(
  platform: OAuthPlatform,
  accessToken: string
): Promise<number | null> {
  try {
    if (platform === "YouTube") {
      const response = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const body = (await response.json()) as {
        items?: Array<{ statistics?: { subscriberCount?: string } }>;
      };
      const count = body.items?.[0]?.statistics?.subscriberCount;
      return count ? parseInt(count, 10) : null;
    }

    if (platform === "Twitch") {
      const clientId = process.env.TWITCH_CLIENT_ID;
      if (!clientId) return null;

      const headers = {
        "Client-Id": clientId,
        Authorization: `Bearer ${accessToken}`,
      };

      const userResponse = await fetch("https://api.twitch.tv/helix/users", {
        headers,
      });
      const userBody = (await userResponse.json()) as {
        data?: Array<{ id: string }>;
      };
      const userId = userBody.data?.[0]?.id;
      if (!userId) return null;

      const followersResponse = await fetch(
        `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${userId}&first=1`,
        { headers }
      );
      const followersBody = (await followersResponse.json()) as {
        total?: number;
      };
      return typeof followersBody.total === "number" ? followersBody.total : null;
    }

    return null;
  } catch {
    return null;
  }
}

async function fetchAudienceSizesForCreator(
  creatorId: string
): Promise<Map<string, number | null>> {
  const sizes = new Map<string, number | null>();
  const connectedPlatforms = await getConnectedOAuthPlatformsForCreator(creatorId);

  await Promise.all(
    connectedPlatforms.map(async (platform) => {
      try {
        const tokenResult = await getOAuthAccessTokenForCreator(creatorId, platform);
        if (!tokenResult) {
          sizes.set(platform, null);
          return;
        }
        const size = await fetchPlatformAudienceSize(
          platform,
          tokenResult.accessToken
        );
        sizes.set(platform, size);
      } catch {
        sizes.set(platform, null);
      }
    })
  );

  return sizes;
}

export function buildCreatorAudienceAnalytics(
  snapshots: PlatformContentSnapshot[],
  audienceSizes: Map<string, number | null>
): CreatorAudienceAnalytics {
  const platformBreakdown = buildBreakdownFromSnapshots(snapshots, audienceSizes);
  const oauthSnapshots = snapshots.filter(
    (s) => s.connectedViaOAuth && s.items.length > 0
  );
  const allContentPoints = buildContentTrendPoints(oauthSnapshots);
  const contentTrend = allContentPoints.slice(-12);
  const weeklyViewsTrend = buildWeeklyViewsTrend(allContentPoints);
  const analyzable = getAnalyzablePlatforms(snapshots);

  const totalViews = platformBreakdown.reduce((sum, row) => sum + row.totalViews, 0);
  const totalContent = platformBreakdown.reduce(
    (sum, row) => sum + row.contentCount,
    0
  );

  return {
    platformBreakdown,
    contentTrend,
    weeklyViewsTrend,
    totalViews,
    totalContent,
    hasOAuthContent: analyzable.length > 0,
    connectedOAuthCount: snapshots.filter((s) => s.connectedViaOAuth).length,
  };
}

export async function getCreatorAudienceAnalytics(
  creatorId: string
): Promise<CreatorAudienceAnalytics> {
  const [snapshots, audienceSizes] = await Promise.all([
    fetchCreatorContentSnapshots(creatorId),
    fetchAudienceSizesForCreator(creatorId),
  ]);

  return buildCreatorAudienceAnalytics(snapshots, audienceSizes);
}
