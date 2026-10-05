import type { Platform } from "@/lib/creators";

export type OAuthPlatform = "YouTube" | "Twitch" | "Instagram" | "TikTok" | "Kick";

export type OAuthPlatformUiStatus = "available" | "coming_soon";

export type OAuthPlatformProminence = "primary" | "secondary";

export interface OAuthPlatformUi {
  platform: OAuthPlatform;
  status: OAuthPlatformUiStatus;
  prominence?: OAuthPlatformProminence;
  note?: "youtube_unverified";
}

export const oauthPlatforms: OAuthPlatform[] = [
  "YouTube",
  "Twitch",
  "Instagram",
  "TikTok",
  "Kick",
];

/** Platforms promoted for public connect. YouTube stays available for testers. */
export const launchOAuthPlatforms: OAuthPlatform[] = ["Twitch", "Kick"];

export const connectOAuthPlatformOrder: OAuthPlatform[] = [
  "Twitch",
  "Kick",
  "YouTube",
  "Instagram",
  "TikTok",
];

export function isOAuthPlatform(platform: Platform): platform is OAuthPlatform {
  return oauthPlatforms.includes(platform as OAuthPlatform);
}
