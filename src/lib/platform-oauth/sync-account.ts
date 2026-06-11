import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentPeriodMonth,
  type RevenueType,
} from "@/lib/creator-revenue";
import type { OAuthPlatform } from "./types";
import {
  isTokenExpired,
  refreshTwitchAccessToken,
  refreshYouTubeAccessToken,
  type OAuthTokens,
} from "./tokens";
import { syncInstagramRevenue } from "./instagram";
import { syncTikTokRevenue } from "./tiktok";
import { syncTwitchRevenue } from "./twitch";
import { syncYouTubeRevenue } from "./youtube";
import { refreshInstagramAccessToken } from "./instagram";
import { refreshTikTokAccessToken } from "./tiktok";

export interface PlatformAccountRow {
  id: string;
  organization_id: string;
  creator_id: string;
  platform: string;
  oauth_metadata: OAuthTokens | null;
  connection_status?: string;
}

async function saveApiRevenueEntry(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  params: {
    organizationId: string;
    creatorId: string;
    platformAccountId: string;
    platform: string;
    revenueType: RevenueType;
    amount: number;
    periodMonth: string;
  }
) {
  const { data: existing } = await supabase
    .from("creator_revenue_entries")
    .select("id, source")
    .eq("platform_account_id", params.platformAccountId)
    .eq("revenue_type", params.revenueType)
    .eq("period_month", params.periodMonth)
    .maybeSingle();

  if (params.amount <= 0) {
    if (existing?.source === "api_sync") {
      await supabase.from("creator_revenue_entries").delete().eq("id", existing.id);
    }
    return null;
  }

  const payload = {
    organization_id: params.organizationId,
    creator_id: params.creatorId,
    platform_account_id: params.platformAccountId,
    platform: params.platform,
    revenue_type: params.revenueType,
    amount: params.amount,
    period_month: params.periodMonth,
    source: "api_sync" as const,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    return supabase
      .from("creator_revenue_entries")
      .update(payload)
      .eq("id", existing.id);
  }

  return supabase.from("creator_revenue_entries").insert(payload);
}

export async function ensureFreshTokensForPlatform(
  platform: OAuthPlatform,
  tokens: OAuthTokens
): Promise<OAuthTokens> {
  if (!isTokenExpired(tokens.expires_at) || !tokens.refresh_token) {
    return tokens;
  }

  if (platform === "YouTube") {
    return refreshYouTubeAccessToken(tokens.refresh_token);
  }

  if (platform === "Twitch") {
    return refreshTwitchAccessToken(tokens.refresh_token);
  }

  if (platform === "Instagram") {
    return refreshInstagramAccessToken(tokens.access_token);
  }

  if (platform === "TikTok" && tokens.refresh_token) {
    return refreshTikTokAccessToken(tokens.refresh_token);
  }

  return tokens;
}

export async function syncCreatorPlatformAccountById(
  accountId: string,
  organizationId: string,
  supabaseClient?: SupabaseClient
): Promise<{ success: true } | { error: string }> {
  const supabase = supabaseClient ?? (await createClient());
  if (!supabase) return { error: "Supabase is not configured." };

  const { data: account, error: fetchError } = await supabase
    .from("creator_platform_accounts")
    .select("id, organization_id, creator_id, platform, oauth_metadata")
    .eq("id", accountId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (fetchError || !account) {
    return { error: "Platform account not found." };
  }

  const row = account as PlatformAccountRow;
  const tokens = row.oauth_metadata;
  if (!tokens?.access_token) {
    return { error: "This account is not connected via OAuth." };
  }

  const platform = row.platform as OAuthPlatform;
  const periodMonth = getCurrentPeriodMonth();

  try {
    const freshTokens = await ensureFreshTokensForPlatform(platform, tokens);
    let handle = "";
    let displayName = "";

    if (platform === "YouTube") {
      const result = await syncYouTubeRevenue(freshTokens.access_token);
      handle = result.handle;
      displayName = result.displayName;

      await saveApiRevenueEntry(supabase, {
        organizationId: row.organization_id,
        creatorId: row.creator_id,
        platformAccountId: row.id,
        platform: row.platform,
        revenueType: "advertisement",
        amount: result.advertisement,
        periodMonth,
      });
      await saveApiRevenueEntry(supabase, {
        organizationId: row.organization_id,
        creatorId: row.creator_id,
        platformAccountId: row.id,
        platform: row.platform,
        revenueType: "other",
        amount: result.other,
        periodMonth,
      });
    } else if (platform === "Twitch") {
      const result = await syncTwitchRevenue(freshTokens.access_token);
      handle = result.handle;
      displayName = result.displayName;

      await saveApiRevenueEntry(supabase, {
        organizationId: row.organization_id,
        creatorId: row.creator_id,
        platformAccountId: row.id,
        platform: row.platform,
        revenueType: "subscription",
        amount: result.subscription,
        periodMonth,
      });
      await saveApiRevenueEntry(supabase, {
        organizationId: row.organization_id,
        creatorId: row.creator_id,
        platformAccountId: row.id,
        platform: row.platform,
        revenueType: "donations",
        amount: result.donations,
        periodMonth,
      });
    } else if (platform === "Instagram") {
      const result = await syncInstagramRevenue(freshTokens.access_token);
      handle = result.handle;
      displayName = result.displayName;

      await saveApiRevenueEntry(supabase, {
        organizationId: row.organization_id,
        creatorId: row.creator_id,
        platformAccountId: row.id,
        platform: row.platform,
        revenueType: "advertisement",
        amount: result.advertisement,
        periodMonth,
      });
      await saveApiRevenueEntry(supabase, {
        organizationId: row.organization_id,
        creatorId: row.creator_id,
        platformAccountId: row.id,
        platform: row.platform,
        revenueType: "other",
        amount: result.other,
        periodMonth,
      });
    } else if (platform === "TikTok") {
      const result = await syncTikTokRevenue(freshTokens.access_token);
      handle = result.handle;
      displayName = result.displayName;

      await saveApiRevenueEntry(supabase, {
        organizationId: row.organization_id,
        creatorId: row.creator_id,
        platformAccountId: row.id,
        platform: row.platform,
        revenueType: "advertisement",
        amount: result.advertisement,
        periodMonth,
      });
      await saveApiRevenueEntry(supabase, {
        organizationId: row.organization_id,
        creatorId: row.creator_id,
        platformAccountId: row.id,
        platform: row.platform,
        revenueType: "donations",
        amount: result.donations,
        periodMonth,
      });
    } else {
      return { error: "Automatic sync is not available for this platform yet." };
    }

    const { error: updateError } = await supabase
      .from("creator_platform_accounts")
      .update({
        account_handle: handle,
        display_name: displayName,
        connection_method: "oauth",
        connection_status: "connected_oauth",
        oauth_metadata: freshTokens,
        last_synced_at: new Date().toISOString(),
        sync_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .eq("organization_id", organizationId);

    if (updateError) return { error: updateError.message };
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Platform sync failed.";

    await supabase
      .from("creator_platform_accounts")
      .update({
        connection_status: "sync_error",
        sync_error: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .eq("organization_id", organizationId);

    return { error: message };
  }
}

async function syncOAuthAccounts(
  supabase: SupabaseClient,
  organizationId?: string
): Promise<{
  synced: number;
  failed: number;
  errors: string[];
}> {
  let query = supabase
    .from("creator_platform_accounts")
    .select("id, organization_id")
    .eq("connection_status", "connected_oauth");

  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  }

  const { data: accounts } = await query;

  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const account of accounts ?? []) {
    const result = await syncCreatorPlatformAccountById(
      account.id,
      account.organization_id,
      supabase
    );
    if ("error" in result) {
      failed += 1;
      errors.push(result.error);
    } else {
      synced += 1;
    }
  }

  return { synced, failed, errors };
}

export async function syncOrgOAuthPlatformAccounts(
  organizationId: string,
  supabaseClient?: SupabaseClient
): Promise<{
  synced: number;
  failed: number;
  errors: string[];
}> {
  const supabase = supabaseClient ?? (await createClient());
  if (!supabase) {
    return { synced: 0, failed: 0, errors: ["Supabase is not configured."] };
  }

  return syncOAuthAccounts(supabase, organizationId);
}

export async function syncAllOAuthPlatformAccounts(
  supabaseClient?: SupabaseClient
): Promise<{
  synced: number;
  failed: number;
  errors: string[];
}> {
  const supabase = supabaseClient ?? (await createClient());
  if (!supabase) {
    return { synced: 0, failed: 0, errors: ["Supabase is not configured."] };
  }

  return syncOAuthAccounts(supabase);
}
