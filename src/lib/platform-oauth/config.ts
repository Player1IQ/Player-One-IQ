import {
  getInstagramClientCredentials,
  getTikTokClientCredentials,
  getTwitchClientCredentials,
  getYouTubeClientCredentials,
} from "./credentials";
import {
  isOAuthPlatform,
  launchOAuthPlatforms,
  oauthPlatforms,
  type OAuthPlatform,
  type OAuthPlatformUi,
  type OAuthPlatformUiStatus,
} from "./types";

export type { OAuthPlatform, OAuthPlatformUi, OAuthPlatformUiStatus } from "./types";
export { isOAuthPlatform, launchOAuthPlatforms, oauthPlatforms };

export function isPlatformOAuthFeatureEnabled(): boolean {
  return process.env.PLATFORM_OAUTH_ENABLED === "true";
}

export function isYouTubeOAuthConfigured(): boolean {
  return Boolean(getYouTubeClientCredentials());
}

export function isTwitchOAuthConfigured(): boolean {
  return Boolean(getTwitchClientCredentials());
}

export function isInstagramOAuthConfigured(): boolean {
  return Boolean(getInstagramClientCredentials());
}

export function isTikTokOAuthConfigured(): boolean {
  return Boolean(getTikTokClientCredentials());
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
  if (!isPlatformOAuthFeatureEnabled()) return false;
  if (!isPlatformOAuthConfigured(platform)) return false;

  if (launchOAuthPlatforms.includes(platform)) {
    return true;
  }

  return platform === "Instagram" || platform === "TikTok";
}

export function getAvailableOAuthPlatforms(): OAuthPlatform[] {
  return oauthPlatforms.filter(isPlatformOAuthAvailable);
}

/** @deprecated Use getOAuthPlatformUi() */
export function getConfiguredOAuthPlatforms(): OAuthPlatform[] {
  return getAvailableOAuthPlatforms();
}

export function getOAuthPlatformUi(): OAuthPlatformUi[] {
  return oauthPlatforms.map((platform) => ({
    platform,
    status: getOAuthPlatformUiStatus(platform),
  }));
}

function getOAuthPlatformUiStatus(platform: OAuthPlatform): OAuthPlatformUiStatus {
  if (!isPlatformOAuthFeatureEnabled()) {
    return "coming_soon";
  }

  if (launchOAuthPlatforms.includes(platform)) {
    return isPlatformOAuthConfigured(platform) ? "available" : "coming_soon";
  }

  if (platform === "Instagram" || platform === "TikTok") {
    return isPlatformOAuthConfigured(platform) ? "available" : "coming_soon";
  }

  return "coming_soon";
}

function formatOAuthPlatformList(platforms: OAuthPlatform[]): string {
  if (platforms.length === 0) return "";
  if (platforms.length === 1) return platforms[0];
  if (platforms.length === 2) return `${platforms[0]} or ${platforms[1]}`;
  return `${platforms.slice(0, -1).join(", ")}, or ${platforms[platforms.length - 1]}`;
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
  const available = platforms
    .filter((entry) => entry.status === "available")
    .map((entry) => entry.platform);

  if (available.length > 0) {
    return `Connect ${formatOAuthPlatformList(available)} to sync profiles and revenue automatically, or add accounts manually.`;
  }

  return "Link platform accounts manually. YouTube, Twitch, and Instagram auto-sync unlock when OAuth is configured.";
}
