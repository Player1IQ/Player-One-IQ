import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import { oauthPlatforms, type OAuthPlatform } from "./types";
import {
  ensureFreshTokensForPlatform,
} from "./sync-account";
import {
  loadPlatformOAuthTokens,
  savePlatformOAuthTokens,
} from "./token-store";

export async function getOAuthAccessTokenForCreator(
  creatorId: string,
  platform: OAuthPlatform
): Promise<{ accessToken: string; accountId: string } | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const organizationId = await getOrganizationId();
  if (!organizationId) return null;

  const { data: account } = await supabase
    .from("creator_platform_accounts")
    .select("id, organization_id, creator_id, platform, connection_status")
    .eq("creator_id", creatorId)
    .eq("organization_id", organizationId)
    .eq("platform", platform)
    .eq("connection_status", "connected_oauth")
    .maybeSingle();

  if (!account) return null;

  const tokens = await loadPlatformOAuthTokens(account.id, organizationId);
  if (!tokens?.access_token) return null;

  const freshTokens = await ensureFreshTokensForPlatform(platform, tokens);

  if (freshTokens !== tokens) {
    const saveResult = await savePlatformOAuthTokens(
      account.id,
      organizationId,
      freshTokens
    );
    if (saveResult.error) return null;
  }

  return { accessToken: freshTokens.access_token, accountId: account.id };
}

export async function getConnectedOAuthPlatformsForCreator(
  creatorId: string
): Promise<OAuthPlatform[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const { data: accounts } = await supabase
    .from("creator_platform_accounts")
    .select("platform")
    .eq("creator_id", creatorId)
    .eq("organization_id", organizationId)
    .eq("connection_status", "connected_oauth");

  return (accounts ?? [])
    .map((account) => account.platform as OAuthPlatform)
    .filter((platform): platform is OAuthPlatform =>
      oauthPlatforms.includes(platform)
    );
}
