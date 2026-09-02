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

async function fetchOAuthPlatformContent(
  creatorId: string,
  platform: OAuthPlatform
): Promise<PlatformContentSnapshot> {
  try {
    const tokenResult = await getOAuthAccessTokenForCreator(creatorId, platform);
    if (!tokenResult) {
      return { platform, items: [], connectedViaOAuth: false };
    }

    let items;
    if (platform === "YouTube") {
      items = (await fetchYouTubeRecentVideos(tokenResult.accessToken)).map(
        (video) => ({
          id: video.videoId,
          title: video.title,
          publishedAt: video.publishedAt,
          contentType: "video" as const,
          viewCount: video.viewCount,
          likeCount: video.likeCount,
          commentCount: video.commentCount,
        })
      );
    } else if (platform === "Twitch") {
      items = await fetchTwitchRecentContent(tokenResult.accessToken);
    } else if (platform === "Instagram") {
      items = await fetchInstagramRecentContent(tokenResult.accessToken);
    } else if (platform === "TikTok") {
      items = await fetchTikTokRecentContent(tokenResult.accessToken);
    } else if (platform === "Kick") {
      items = await fetchKickRecentContent(tokenResult.accessToken);
    } else {
      return { platform, items: [], connectedViaOAuth: false };
    }

    return { platform, items, connectedViaOAuth: true };
  } catch {
    return { platform, items: [], connectedViaOAuth: false };
  }
}

export async function fetchCreatorContentSnapshots(
  creatorId: string,
  scope: ContentAnalysisScope = "all"
): Promise<PlatformContentSnapshot[]> {
  const platformsToFetch: OAuthPlatform[] =
    scope === "all" ? [...oauthPlatforms] : [scope];

  return Promise.all(
    platformsToFetch.map((platform) =>
      fetchOAuthPlatformContent(creatorId, platform)
    )
  );
}

export function getAnalyzablePlatforms(
  snapshots: PlatformContentSnapshot[]
): PlatformContentSnapshot[] {
  return snapshots.filter(
    (snapshot) => snapshot.connectedViaOAuth && snapshot.items.length > 0
  );
}
