import type { ContentPerformanceItem } from "./content-performance";

export async function fetchTikTokRecentContent(
  accessToken: string,
  limit = 12
): Promise<ContentPerformanceItem[]> {
  const response = await fetch("https://open.tiktokapis.com/v2/video/list/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ max_count: limit }),
  });

  const body = (await response.json()) as {
    data?: {
      videos?: Array<{
        id: string;
        title?: string;
        create_time?: number;
        view_count?: number;
        like_count?: number;
        comment_count?: number;
      }>;
    };
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(body.error?.message ?? "Could not read recent TikTok videos.");
  }

  return (body.data?.videos ?? []).map((video) => ({
    id: video.id,
    title: video.title || "TikTok video",
    publishedAt: video.create_time
      ? new Date(video.create_time * 1000).toISOString()
      : "",
    contentType: "video" as const,
    viewCount: video.view_count ?? 0,
    likeCount: video.like_count,
    commentCount: video.comment_count,
  }));
}
