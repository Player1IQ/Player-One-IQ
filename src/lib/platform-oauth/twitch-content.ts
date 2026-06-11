import type { ContentPerformanceItem } from "./content-performance";

function twitchHeaders(accessToken: string) {
  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!clientId) throw new Error("Twitch OAuth is not configured.");
  return {
    "Client-Id": clientId,
    Authorization: `Bearer ${accessToken}`,
  };
}

async function getTwitchUserId(accessToken: string): Promise<string> {
  const response = await fetch("https://api.twitch.tv/helix/users", {
    headers: twitchHeaders(accessToken),
  });

  const body = (await response.json()) as {
    data?: Array<{ id: string }>;
    message?: string;
  };

  if (!response.ok || !body.data?.[0]?.id) {
    throw new Error(body.message ?? "Could not read the authorized Twitch account.");
  }

  return body.data[0].id;
}

export async function fetchTwitchRecentContent(
  accessToken: string,
  limit = 12
): Promise<ContentPerformanceItem[]> {
  const userId = await getTwitchUserId(accessToken);
  const headers = twitchHeaders(accessToken);

  const [videosResponse, clipsResponse] = await Promise.all([
    fetch(
      `https://api.twitch.tv/helix/videos?user_id=${userId}&type=archive&first=${limit}`,
      { headers }
    ),
    fetch(
      `https://api.twitch.tv/helix/clips?broadcaster_id=${userId}&first=${Math.min(limit, 20)}`,
      { headers }
    ),
  ]);

  const videosBody = (await videosResponse.json()) as {
    data?: Array<{
      id: string;
      title: string;
      created_at: string;
      view_count: number;
    }>;
    message?: string;
  };

  if (!videosResponse.ok) {
    throw new Error(videosBody.message ?? "Could not read recent Twitch VODs.");
  }

  const clipsBody = (await clipsResponse.json()) as {
    data?: Array<{
      id: string;
      title: string;
      created_at: string;
      view_count: number;
    }>;
    message?: string;
  };

  const vodItems: ContentPerformanceItem[] = (videosBody.data ?? []).map((vod) => ({
    id: vod.id,
    title: vod.title,
    publishedAt: vod.created_at,
    contentType: "stream",
    viewCount: vod.view_count,
  }));

  const clipItems: ContentPerformanceItem[] = (clipsResponse.ok
    ? (clipsBody.data ?? [])
    : []
  ).map((clip) => ({
    id: clip.id,
    title: clip.title,
    publishedAt: clip.created_at,
    contentType: "clip",
    viewCount: clip.view_count,
  }));

  return [...vodItems, ...clipItems]
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    .slice(0, limit);
}
