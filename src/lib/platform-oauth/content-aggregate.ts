import { cache } from "react";
import { getOAuthAccessTokenForCreator } from "./account-access";
import type {
  ContentAnalysisScope,
  PlatformContentSnapshot,
} from "./content-performance";
import { oauthPlatforms, type OAuthPlatform } from "./types";
import { fetchInstagramRecentContent } from "./instagram-content";
import { fetchTikTokRecentContent } from "./tiktok-content";
import { fetchTwitchRecentContent } from "./twitch-content";
import { fetchYouTubeRecentVideos } from "./youtube-content";
import { fetchKickRecentContent } from "./kick-content";
import { logServerTiming, withTimeout } from "@/lib/observability/timing";

const PLATFORM_FETCH_TIMEOUT_MS = 5000;

export async function fetchPlatformContentWithToken(
  platform: OAuthPlatform,
  accessToken: string
): Promise<PlatformContentSnapshot> {
  let items;
  if (platform === "YouTube") {
    items = (await fetchYouTubeRecentVideos(accessToken)).map((video) => ({
      id: video.videoId,
      title: video.title,
      publishedAt: video.publishedAt,
      contentType: "video" as const,
      viewCount: video.viewCount,
      likeCount: video.likeCount,
      commentCount: video.commentCount,
    }));
  } else if (platform === "Twitch") {
    items = await fetchTwitchRecentContent(accessToken);
  } else if (platform === "Instagram") {
    items = await fetchInstagramRecentContent(accessToken);
  } else if (platform === "TikTok") {
    items = await fetchTikTokRecentContent(accessToken);
  } else if (platform === "Kick") {
    items = await fetchKickRecentContent(accessToken);
  } else {
    return { platform, items: [], connectedViaOAuth: false };
  }

  return { platform, items, connectedViaOAuth: true };
}

async function fetchOAuthPlatformContent(
  creatorId: string,
  platform: OAuthPlatform
): Promise<PlatformContentSnapshot> {
  const empty: PlatformContentSnapshot = {
    platform,
    items: [],
    connectedViaOAuth: false,
  };
  const startedAt = Date.now();
  try {
    const snapshot = await withTimeout(async () => {
      const tokenResult = await getOAuthAccessTokenForCreator(
        creatorId,
        platform
      );
      if (!tokenResult) return empty;
      return fetchPlatformContentWithToken(platform, tokenResult.accessToken);
    }, PLATFORM_FETCH_TIMEOUT_MS, empty);
    logServerTiming(`oauth-content ${platform}`, startedAt);
    return snapshot;
  } catch {
    logServerTiming(`oauth-content ${platform} failed`, startedAt);
    return empty;
  }
}

export const fetchCreatorContentSnapshots = cache(
  async (
    creatorId: string,
    scope: ContentAnalysisScope = "all"
  ): Promise<PlatformContentSnapshot[]> => {
    const platformsToFetch: OAuthPlatform[] =
      scope === "all" ? [...oauthPlatforms] : [scope];

    return Promise.all(
      platformsToFetch.map((platform) =>
        fetchOAuthPlatformContent(creatorId, platform)
      )
    );
  }
);

export function getAnalyzablePlatforms(
  snapshots: PlatformContentSnapshot[]
): PlatformContentSnapshot[] {
  return snapshots.filter(
    (snapshot) => snapshot.connectedViaOAuth && snapshot.items.length > 0
  );
}
