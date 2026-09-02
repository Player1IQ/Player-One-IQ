import type { ContentPerformanceItem } from "./content-performance";
import { fetchKickUser, kickHeaders } from "./kick";

interface KickLivestream {
  id?: string;
  title?: string;
  stream_title?: string;
  started_at?: string;
  viewer_count?: number;
}

export async function fetchKickRecentContent(
  accessToken: string
): Promise<ContentPerformanceItem[]> {
  const user = await fetchKickUser(accessToken);
  if (!user.user_id) return [];

  const response = await fetch(
    `https://api.kick.com/public/v1/users/livestreams?user_id=${user.user_id}`,
    { headers: kickHeaders(accessToken) }
  );

  const body = (await response.json()) as {
    data?: KickLivestream[];
    message?: string;
  };

  if (!response.ok) {
    throw new Error(body.message ?? "Could not read Kick livestreams.");
  }

  return (body.data ?? []).map((stream) => ({
    id: stream.id ?? `kick-live-${user.user_id}`,
    title: stream.title ?? stream.stream_title ?? "Live on Kick",
    publishedAt: stream.started_at ?? new Date().toISOString(),
    contentType: "stream" as const,
    viewCount: stream.viewer_count ?? 0,
  }));
}
