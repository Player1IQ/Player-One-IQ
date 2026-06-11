import type { ContentPerformanceItem } from "./content-performance";

const GRAPH_VERSION = "v21.0";

export async function fetchInstagramRecentContent(
  accessToken: string,
  limit = 12
): Promise<ContentPerformanceItem[]> {
  const response = await fetch(
    `https://graph.instagram.com/${GRAPH_VERSION}/me/media?fields=id,caption,media_type,timestamp,like_count,comments_count&limit=${limit}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const body = (await response.json()) as {
    data?: Array<{
      id: string;
      caption?: string;
      media_type?: string;
      timestamp?: string;
      like_count?: number;
      comments_count?: number;
    }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(
      body.error?.message ?? "Could not read recent Instagram posts."
    );
  }

  return (body.data ?? []).map((post) => ({
    id: post.id,
    title: post.caption?.slice(0, 120) || `${post.media_type ?? "Post"} on Instagram`,
    publishedAt: post.timestamp ?? "",
    contentType:
      post.media_type === "REELS" || post.media_type === "VIDEO"
        ? ("reel" as const)
        : ("post" as const),
    viewCount: 0,
    likeCount: post.like_count,
    commentCount: post.comments_count,
  }));
}
