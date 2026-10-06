import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ContentPerformanceItem } from "./content-performance";
import { isOAuthPlatform, type OAuthPlatform } from "./types";
import {
  parseCachedContentItems,
  type StoredPlatformCache,
} from "./content-cache-client";

export {
  audienceSizesFromCache,
  buildPlatformAnalyticsStatuses,
  formatAnalyticsUpdatedLabel,
  latestCacheTimestamp,
  parseCachedContentItems,
  platformNeedsReconnect,
  platformsNeedingFirstFetch,
  snapshotsFromCache,
  type PlatformAnalyticsStatus,
  type StoredPlatformCache,
} from "./content-cache-client";

async function getReadableClient(): Promise<SupabaseClient | null> {
  return (await createClient()) ?? createServiceClient();
}

export async function loadCreatorPlatformContentCache(
  creatorId: string,
  supabaseClient?: SupabaseClient
): Promise<StoredPlatformCache[]> {
  const supabase = supabaseClient ?? (await getReadableClient());
  if (!supabase) return [];

  const { data } = await supabase
    .from("creator_platform_content_cache")
    .select(
      "platform, items, audience_size, fetched_at, last_error, platform_account_id"
    )
    .eq("creator_id", creatorId);

  return (data ?? [])
    .filter((row) => isOAuthPlatform(row.platform))
    .map((row) => ({
      platform: row.platform as OAuthPlatform,
      items: parseCachedContentItems(row.items),
      audienceSize:
        typeof row.audience_size === "number" ? row.audience_size : null,
      fetchedAt: row.fetched_at as string,
      lastError: (row.last_error as string | null) ?? null,
      platformAccountId: (row.platform_account_id as string | null) ?? null,
    }));
}

export async function saveCreatorPlatformContentCache(input: {
  organizationId: string;
  creatorId: string;
  platform: OAuthPlatform;
  platformAccountId?: string | null;
  items: ContentPerformanceItem[];
  audienceSize: number | null;
  lastError?: string | null;
  supabase?: SupabaseClient;
}): Promise<void> {
  const supabase = input.supabase ?? createServiceClient();
  if (!supabase) return;

  await supabase.from("creator_platform_content_cache").upsert(
    {
      organization_id: input.organizationId,
      creator_id: input.creatorId,
      platform_account_id: input.platformAccountId ?? null,
      platform: input.platform,
      items: input.items,
      audience_size: input.audienceSize,
      fetched_at: new Date().toISOString(),
      last_error: input.lastError ?? null,
    },
    { onConflict: "creator_id,platform" }
  );
}
