export interface YouTubeVideoPerformance {
  videoId: string;
  title: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export async function fetchYouTubeRecentVideos(
  accessToken: string,
  limit = 12
): Promise<YouTubeVideoPerformance[]> {
  const channelResponse = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const channelBody = (await channelResponse.json()) as {
    items?: Array<{
      contentDetails?: { relatedPlaylists?: { uploads?: string } };
    }>;
    error?: { message?: string };
  };

  if (!channelResponse.ok || !channelBody.items?.[0]) {
    throw new Error(
      channelBody.error?.message ?? "Could not read YouTube channel uploads."
    );
  }

  const uploadsPlaylistId =
    channelBody.items[0].contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    throw new Error("No uploads playlist found for this YouTube channel.");
  }

  const playlistResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${limit}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const playlistBody = (await playlistResponse.json()) as {
    items?: Array<{
      contentDetails?: { videoId?: string };
      snippet?: { title?: string; publishedAt?: string };
    }>;
    error?: { message?: string };
  };

  if (!playlistResponse.ok) {
    throw new Error(
      playlistBody.error?.message ?? "Could not read recent YouTube uploads."
    );
  }

  const playlistItems = playlistBody.items ?? [];
  const videoIds = playlistItems
    .map((item) => item.contentDetails?.videoId)
    .filter((id): id is string => Boolean(id));

  if (videoIds.length === 0) return [];

  const statsResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds.join(",")}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const statsBody = (await statsResponse.json()) as {
    items?: Array<{
      id: string;
      snippet?: { title?: string; publishedAt?: string };
      statistics?: {
        viewCount?: string;
        likeCount?: string;
        commentCount?: string;
      };
    }>;
    error?: { message?: string };
  };

  if (!statsResponse.ok) {
    throw new Error(
      statsBody.error?.message ?? "Could not read YouTube video statistics."
    );
  }

  const statsById = new Map(
    (statsBody.items ?? []).map((item) => [item.id, item])
  );

  return playlistItems
    .map((playlistItem) => {
      const videoId = playlistItem.contentDetails?.videoId;
      if (!videoId) return null;

      const stats = statsById.get(videoId);
      if (!stats) return null;

      return {
        videoId,
        title:
          stats.snippet?.title?.trim() ||
          playlistItem.snippet?.title?.trim() ||
          "Untitled",
        publishedAt:
          stats.snippet?.publishedAt ?? playlistItem.snippet?.publishedAt ?? "",
        viewCount: Number(stats.statistics?.viewCount ?? 0),
        likeCount: Number(stats.statistics?.likeCount ?? 0),
        commentCount: Number(stats.statistics?.commentCount ?? 0),
      };
    })
    .filter((item): item is YouTubeVideoPerformance => item !== null);
}
