import type { Platform } from "@/lib/creators";

export type OAuthPlatform = "YouTube" | "Twitch" | "Instagram" | "TikTok";

export type OAuthPlatformUiStatus = "available" | "coming_soon";

export interface OAuthPlatformUi {
  platform: OAuthPlatform;
  status: OAuthPlatformUiStatus;
}

export const oauthPlatforms: OAuthPlatform[] = [
  "YouTube",
  "Twitch",
  "Instagram",
  "TikTok",
];

/** Platforms enabled for public launch (v1). */
export const launchOAuthPlatforms: OAuthPlatform[] = ["YouTube", "Twitch"];

export function isOAuthPlatform(platform: Platform): platform is OAuthPlatform {
  return oauthPlatforms.includes(platform as OAuthPlatform);
}
