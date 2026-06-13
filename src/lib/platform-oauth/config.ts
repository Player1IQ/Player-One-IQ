import {
  isOAuthPlatform,
  launchOAuthPlatforms,
  oauthPlatforms,
  type OAuthPlatform,
  type OAuthPlatformUi,
} from "./types";

export type { OAuthPlatform, OAuthPlatformUi, OAuthPlatformUiStatus } from "./types";
export { isOAuthPlatform, launchOAuthPlatforms, oauthPlatforms };

export function isPlatformOAuthFeatureEnabled(): boolean {
  return process.env.PLATFORM_OAUTH_ENABLED === "true";
}

export function isYouTubeOAuthConfigured(): boolean {
  return Boolean(
    process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET
  );
}

export function isTwitchOAuthConfigured(): boolean {
  return Boolean(
    process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET
  );
}

export function isInstagramOAuthConfigured(): boolean {
  return Boolean(
    process.env.INSTAGRAM_CLIENT_ID && process.env.INSTAGRAM_CLIENT_SECRET
  );
}

export function isTikTokOAuthConfigured(): boolean {
  return Boolean(
    process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET
  );
}

export function isPlatformOAuthConfigured(platform: OAuthPlatform): boolean {
  if (platform === "YouTube") return isYouTubeOAuthConfigured();
  if (platform === "Twitch") return isTwitchOAuthConfigured();
  if (platform === "Instagram") return isInstagramOAuthConfigured();
  if (platform === "TikTok") return isTikTokOAuthConfigured();
  return false;
}

export function isPlatformOAuthLaunched(platform: OAuthPlatform): boolean {
  return launchOAuthPlatforms.includes(platform);
}

export function isPlatformOAuthAvailable(platform: OAuthPlatform): boolean {
  return (
    isPlatformOAuthLaunched(platform) &&
    isPlatformOAuthFeatureEnabled() &&
    isPlatformOAuthConfigured(platform)
  );
}

export function getAvailableOAuthPlatforms(): OAuthPlatform[] {
  return oauthPlatforms.filter(isPlatformOAuthAvailable);
}

/** @deprecated Use getOAuthPlatformUi() */
export function getConfiguredOAuthPlatforms(): OAuthPlatform[] {
  return getAvailableOAuthPlatforms();
}

export function getOAuthPlatformUi(): OAuthPlatformUi[] {
  return launchOAuthPlatforms.map((platform) => ({
    platform,
    status: isPlatformOAuthAvailable(platform) ? "available" : "coming_soon",
  }));
}

export function getComingSoonOAuthPlatforms(): OAuthPlatform[] {
  return oauthPlatforms.filter((platform) => !isPlatformOAuthLaunched(platform));
}

export function hasAvailablePlatformOAuth(
  platforms: OAuthPlatformUi[]
): boolean {
  return platforms.some((entry) => entry.status === "available");
}

export function platformOAuthDescription(platforms: OAuthPlatformUi[]): string {
  if (hasAvailablePlatformOAuth(platforms)) {
    return "Connect YouTube or Twitch to sync profiles and revenue automatically, or add accounts manually.";
  }
  return "Link platform accounts manually. YouTube and Twitch auto-sync unlock when OAuth is configured.";
}
