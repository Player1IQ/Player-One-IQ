import type { OAuthPlatform } from "./types";

export type ContentCoachPlatform = OAuthPlatform;

export const contentCoachPlatforms: ContentCoachPlatform[] = [
  "YouTube",
  "Twitch",
  "Instagram",
  "TikTok",
];

export type ContentItemType = "video" | "stream" | "clip" | "post" | "reel";

export interface ContentPerformanceItem {
  id: string;
  title: string;
  publishedAt: string;
  contentType: ContentItemType;
  viewCount: number;
  likeCount?: number;
  commentCount?: number;
}

export interface PlatformContentSnapshot {
  platform: ContentCoachPlatform;
  items: ContentPerformanceItem[];
  connectedViaOAuth: boolean;
}

export type ContentAnalysisScope = "all" | OAuthPlatform;
