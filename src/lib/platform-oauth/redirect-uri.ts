import { getAppOrigin } from "@/lib/email/app-url";
import { getOAuthPlatformSlug } from "./platform-slug";
import type { OAuthPlatform } from "./types";

export async function getOAuthRedirectUri(
  platform: OAuthPlatform
): Promise<string> {
  const origin = await getAppOrigin();
  return `${origin}/api/platform-oauth/${getOAuthPlatformSlug(platform)}/callback`;
}
