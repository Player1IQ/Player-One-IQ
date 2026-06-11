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

async function fetchOAuthPlatformContent(
  creatorId: string,
  platform: OAuthPlatform
): Promise<PlatformContentSnapshot> {
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
  } else {
    items = await fetchTikTokRecentContent(tokenResult.accessToken);
  }

  return { platform, items, connectedViaOAuth: true };
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
