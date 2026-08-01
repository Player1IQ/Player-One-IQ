import type { ContentPerformanceItem } from "./content-performance";

export async function fetchTikTokRecentContent(
  accessToken: string,
  limit = 12
): Promise<ContentPerformanceItem[]> {
  const fields =
    "id,title,video_description,create_time,view_count,like_count,comment_count";
  const response = await fetch(
    `https://open.tiktokapis.com/v2/video/list/?fields=${fields}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ max_count: limit }),
    }
  );

  const body = (await response.json()) as {
    data?: {
      videos?: Array<{
        id: string;
        title?: string;
        video_description?: string;
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
    title:
      video.video_description?.trim() ||
      video.title?.trim() ||
      "TikTok video",
    publishedAt: video.create_time
      ? new Date(video.create_time * 1000).toISOString()
      : "",
    contentType: "video" as const,
    viewCount: video.view_count ?? 0,
    likeCount: video.like_count,
    commentCount: video.comment_count,
  }));
}
