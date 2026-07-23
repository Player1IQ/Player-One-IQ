import { createServiceClient } from "@/lib/supabase/admin";
import type { OAuthTokens } from "./tokens";

export async function savePlatformOAuthTokens(
  accountId: string,
  organizationId: string,
  tokens: OAuthTokens
): Promise<{ error?: string }> {
  const supabase = createServiceClient();
  if (!supabase) return { error: "Service client is not configured." };

  const { error } = await supabase
    .from("creator_platform_accounts")
    .update({
      oauth_metadata: tokens,
      updated_at: new Date().toISOString(),
    })
    .eq("id", accountId)
    .eq("organization_id", organizationId);

  if (error) return { error: error.message };
  return {};
}

export async function clearPlatformOAuthTokens(
  accountId: string,
  organizationId: string
): Promise<{ error?: string }> {
  const supabase = createServiceClient();
  if (!supabase) return { error: "Service client is not configured." };

  const { error } = await supabase
    .from("creator_platform_accounts")
    .update({
      oauth_metadata: {},
      updated_at: new Date().toISOString(),
    })
    .eq("id", accountId)
    .eq("organization_id", organizationId);

  if (error) return { error: error.message };
  return {};
}

export async function loadPlatformOAuthTokens(
  accountId: string,
  organizationId: string
): Promise<OAuthTokens | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("creator_platform_accounts")
    .select("oauth_metadata")
    .eq("id", accountId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data?.oauth_metadata) return null;
  const tokens = data.oauth_metadata as OAuthTokens;
  return tokens?.access_token ? tokens : null;
}
