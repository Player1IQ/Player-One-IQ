import { getOAuthAccessTokenForCreator } from "./account-access";
import {
  fetchCreatorContentSnapshots,
  getAnalyzablePlatforms,
} from "./content-aggregate";
import type { PlatformContentSnapshot } from "./content-performance";
import { oauthPlatforms, type OAuthPlatform } from "./types";

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
}

export interface CreatorAudienceAnalytics {
  platformBreakdown: PlatformBreakdownMetric[];
  contentTrend: ContentTrendPoint[];
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

function truncateLabel(title: string, max = 22): string {
  const trimmed = title.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
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

function buildContentTrend(snapshots: PlatformContentSnapshot[]): ContentTrendPoint[] {
  const points: ContentTrendPoint[] = [];

  for (const snapshot of snapshots) {
    for (const item of snapshot.items) {
      points.push({
        id: `${snapshot.platform}-${item.id}`,
        label: truncateLabel(item.title || "Untitled"),
        views: item.viewCount,
        engagement: engagementForItem(item),
        platform: snapshot.platform,
      });
    }
  }

  return points
    .sort((a, b) => b.views - a.views)
    .slice(0, 12);
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

  await Promise.all(
    oauthPlatforms.map(async (platform) => {
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
    })
  );

  return sizes;
}

export function buildCreatorAudienceAnalytics(
  snapshots: PlatformContentSnapshot[],
  audienceSizes: Map<string, number | null>
): CreatorAudienceAnalytics {
  const platformBreakdown = buildBreakdownFromSnapshots(snapshots, audienceSizes);
  const contentTrend = buildContentTrend(
    snapshots.filter((s) => s.connectedViaOAuth && s.items.length > 0)
  );
  const analyzable = getAnalyzablePlatforms(snapshots);

  const totalViews = platformBreakdown.reduce((sum, row) => sum + row.totalViews, 0);
  const totalContent = platformBreakdown.reduce(
    (sum, row) => sum + row.contentCount,
    0
  );

  return {
    platformBreakdown,
    contentTrend,
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
