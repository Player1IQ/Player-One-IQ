import type { OAuthPlatform } from "./types";

const platformSlugs: Record<OAuthPlatform, string> = {
  YouTube: "youtube",
  Twitch: "twitch",
  Instagram: "instagram",
  TikTok: "tiktok",
};

export function getOAuthPlatformSlug(platform: OAuthPlatform): string {
  return platformSlugs[platform];
}
