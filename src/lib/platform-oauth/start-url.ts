import type { OAuthPlatform } from "./types";
import { getOAuthPlatformSlug } from "./platform-slug";

export function getPlatformOAuthStartUrl(
  platform: OAuthPlatform,
  creatorId: string,
  returnTo?: string
): string {
  const params = new URLSearchParams({ creatorId });
  if (returnTo) {
    params.set("returnTo", returnTo);
  }
  return `/api/platform-oauth/${getOAuthPlatformSlug(platform)}/start?${params.toString()}`;
}
