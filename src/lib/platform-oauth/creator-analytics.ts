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

export function buildWeeklyViewsTrend(
  points: ContentTrendPoint[]
): WeeklyViewsPoint[] {
  const buckets = new Map<string, { views: number; contentCount: number }>();

  for (const point of points) {
    const weekStart = getWeekStartUtc(point.publishedAt);
    if (!weekStart) continue;

    const existing = buckets.get(weekStart) ?? { views: 0, contentCount: 0 };
    buckets.set(weekStart, {
      views: existing.views + point.views,
      contentCount: existing.contentCount + 1,
    });
  }

  return [...buckets.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([weekStart, bucket]) => ({
      weekStart,
      label: formatWeekLabel(weekStart),
      views: bucket.views,
      contentCount: bucket.contentCount,
    }));
}

function buildContentTrend(snapshots: PlatformContentSnapshot[]): ContentTrendPoint[] {
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

  return points
    .sort(
      (left, right) =>
        new Date(left.publishedAt).getTime() - new Date(right.publishedAt).getTime()
    )
    .slice(-12);
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
  const contentTrend = buildContentTrend(oauthSnapshots);
  const weeklyViewsTrend = buildWeeklyViewsTrend(contentTrend);
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
