import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/admin";
import { fetchPlatformAudienceSize } from "./creator-analytics";
import { fetchPlatformContentWithToken } from "./content-aggregate";
import { saveCreatorPlatformContentCache } from "./content-cache";
import { withTimeout } from "@/lib/observability/timing";
import {
  isOAuthPlatform,
  type OAuthPlatform,
} from "./types";
import { ensureFreshTokensForPlatform } from "./sync-account";
import { loadPlatformOAuthTokens, savePlatformOAuthTokens } from "./token-store";

export interface MetricHistoryPoint {
  capturedOn: string;
  audienceSize: number | null;
  viewTotal: number | null;
}

export function weekOverWeekPercent(
  current: number | null | undefined,
  previous: number | null | undefined
): number | null {
  if (current == null || previous == null) return null;
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function pickGrowthPair(
  points: MetricHistoryPoint[]
): { current: MetricHistoryPoint; previous: MetricHistoryPoint } | null {
  if (points.length < 2) return null;
  const sorted = [...points].sort((left, right) =>
    left.capturedOn.localeCompare(right.capturedOn)
  );
  const current = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];
  if (!current || !previous) return null;
  return { current, previous };
}

async function getFreshAccessToken(
  accountId: string,
  organizationId: string,
  platform: OAuthPlatform
): Promise<string | null> {
  const tokens = await loadPlatformOAuthTokens(accountId, organizationId);
  if (!tokens?.access_token) return null;

  try {
    const fresh = await ensureFreshTokensForPlatform(platform, tokens);
    if (fresh !== tokens) {
      await savePlatformOAuthTokens(accountId, organizationId, fresh);
    }
    return fresh.access_token;
  } catch {
    return tokens.access_token;
  }
}

export async function recordCreatorPlatformMetricSnapshot(input: {
  organizationId: string;
  creatorId: string;
  platform: OAuthPlatform;
  platformAccountId?: string | null;
  supabase?: SupabaseClient;
}): Promise<{ ok: true } | { error: string }> {
  const supabase = input.supabase ?? createServiceClient();
  if (!supabase) return { error: "Service client is not configured." };

  let accountId = input.platformAccountId ?? null;
  if (!accountId) {
    const { data: account } = await supabase
      .from("creator_platform_accounts")
      .select("id")
      .eq("creator_id", input.creatorId)
      .eq("organization_id", input.organizationId)
      .eq("platform", input.platform)
      .eq("connection_status", "connected_oauth")
      .maybeSingle();
    accountId = account?.id ?? null;
  }

  if (!accountId) {
    return { error: "Connected platform account not found." };
  }

  const accessToken = await getFreshAccessToken(
    accountId,
    input.organizationId,
    input.platform
  );

  const emptySnapshot = {
    platform: input.platform,
    items: [] as Awaited<
      ReturnType<typeof fetchPlatformContentWithToken>
    >["items"],
    connectedViaOAuth: false,
  };
  const [audienceSize, snapshot] = await Promise.all([
    accessToken
      ? fetchPlatformAudienceSize(input.platform, accessToken)
      : Promise.resolve(null),
    accessToken
      ? withTimeout(
          () => fetchPlatformContentWithToken(input.platform, accessToken),
          5000,
          emptySnapshot
        )
      : Promise.resolve(emptySnapshot),
  ]);

  const viewTotal = snapshot.items.reduce((sum, item) => sum + item.viewCount, 0);
  const contentCount = snapshot.items.length;
  const capturedOn = new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from("creator_platform_metric_snapshots").upsert(
    {
      organization_id: input.organizationId,
      creator_id: input.creatorId,
      platform_account_id: accountId,
      platform: input.platform,
      captured_on: capturedOn,
      audience_size: audienceSize,
      view_total: viewTotal,
      content_count: contentCount,
      created_at: new Date().toISOString(),
    },
    { onConflict: "creator_id,platform,captured_on" }
  );

  if (error) return { error: error.message };

  await saveCreatorPlatformContentCache({
    organizationId: input.organizationId,
    creatorId: input.creatorId,
    platform: input.platform,
    platformAccountId: accountId,
    items: snapshot.items,
    audienceSize,
    lastError: !accessToken
      ? "Reconnect this platform to refresh stats."
      : !snapshot.connectedViaOAuth && snapshot.items.length === 0
        ? "This platform did not return stats in time. Try Refresh, or reconnect if it keeps failing."
        : null,
    supabase,
  });

  return { ok: true };
}

export async function recordAllConnectedPlatformMetricSnapshots(
  supabaseClient?: SupabaseClient
): Promise<{ recorded: number; failed: number; errors: string[] }> {
  const supabase = supabaseClient ?? createServiceClient();
  if (!supabase) {
    return {
      recorded: 0,
      failed: 0,
      errors: ["Service client is not configured."],
    };
  }

  const { data: accounts, error } = await supabase
    .from("creator_platform_accounts")
    .select("id, organization_id, creator_id, platform")
    .eq("connection_status", "connected_oauth");

  if (error) {
    return { recorded: 0, failed: 0, errors: [error.message] };
  }

  let recorded = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const account of accounts ?? []) {
    if (!isOAuthPlatform(account.platform)) continue;
    const result = await recordCreatorPlatformMetricSnapshot({
      organizationId: account.organization_id,
      creatorId: account.creator_id,
      platform: account.platform,
      platformAccountId: account.id,
      supabase,
    });
    if ("error" in result) {
      failed += 1;
      errors.push(`${account.platform}: ${result.error}`);
    } else {
      recorded += 1;
    }
  }

  return { recorded, failed, errors };
}

export async function listCreatorMetricHistory(
  creatorId: string,
  supabaseClient?: SupabaseClient
): Promise<MetricHistoryPoint[]> {
  const supabase = supabaseClient ?? createServiceClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("creator_platform_metric_snapshots")
    .select("captured_on, audience_size, view_total")
    .eq("creator_id", creatorId)
    .order("captured_on", { ascending: true });

  const byDay = new Map<string, MetricHistoryPoint>();
  for (const row of data ?? []) {
    const existing = byDay.get(row.captured_on);
    const audience = row.audience_size as number | null;
    const views = row.view_total as number | null;
    if (!existing) {
      byDay.set(row.captured_on, {
        capturedOn: row.captured_on,
        audienceSize: audience,
        viewTotal: views,
      });
      continue;
    }
    byDay.set(row.captured_on, {
      capturedOn: row.captured_on,
      audienceSize:
        existing.audienceSize == null && audience == null
          ? null
          : (existing.audienceSize ?? 0) + (audience ?? 0),
      viewTotal:
        existing.viewTotal == null && views == null
          ? null
          : (existing.viewTotal ?? 0) + (views ?? 0),
    });
  }

  return [...byDay.values()];
}
