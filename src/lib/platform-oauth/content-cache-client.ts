import { formatRelativeTime } from "@/lib/contracts";
import type { CreatorPlatformAccount } from "@/lib/creator-revenue";
import type {
  ContentItemType,
  ContentPerformanceItem,
  PlatformContentSnapshot,
} from "./content-performance";
import type { OAuthPlatform } from "./types";

export interface PlatformAnalyticsStatus {
  platform: string;
  connectedViaOAuth: boolean;
  needsReconnect: boolean;
  reconnectReason: string | null;
  updatedAt: string | null;
  hasStoredCache: boolean;
}

export interface StoredPlatformCache {
  platform: OAuthPlatform;
  items: ContentPerformanceItem[];
  audienceSize: number | null;
  fetchedAt: string;
  lastError: string | null;
  platformAccountId: string | null;
}

const CONTENT_ITEM_TYPES: ContentItemType[] = [
  "video",
  "stream",
  "clip",
  "post",
  "reel",
];

export function parseCachedContentItems(
  value: unknown
): ContentPerformanceItem[] {
  if (!Array.isArray(value)) return [];
  const items: ContentPerformanceItem[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    if (typeof row.id !== "string" || typeof row.title !== "string") continue;
    if (typeof row.publishedAt !== "string" || typeof row.viewCount !== "number") {
      continue;
    }
    const contentType = CONTENT_ITEM_TYPES.includes(row.contentType as ContentItemType)
      ? (row.contentType as ContentItemType)
      : "video";
    items.push({
      id: row.id,
      title: row.title,
      publishedAt: row.publishedAt,
      contentType,
      viewCount: row.viewCount,
      likeCount: typeof row.likeCount === "number" ? row.likeCount : undefined,
      commentCount:
        typeof row.commentCount === "number" ? row.commentCount : undefined,
    });
  }
  return items;
}

export function platformsNeedingFirstFetch(
  connectedPlatforms: string[],
  cachedPlatforms: string[]
): string[] {
  const cached = new Set(cachedPlatforms);
  return connectedPlatforms.filter((platform) => !cached.has(platform));
}

export function platformNeedsReconnect(input: {
  connectionStatus: string;
  syncError: string | null;
  cacheError: string | null;
}): boolean {
  if (input.connectionStatus === "sync_error") return true;
  if (input.connectionStatus === "pending_oauth") return true;
  if (input.connectionStatus === "disconnected") return true;
  return Boolean(input.syncError || input.cacheError);
}

export function formatAnalyticsUpdatedLabel(iso: string | null): string | null {
  if (!iso) return null;
  const relative = formatRelativeTime(iso);
  const suffix = relative === "Just now" ? "just now" : relative;
  return `Updated ${suffix}`;
}

export function buildPlatformAnalyticsStatuses(
  accounts: CreatorPlatformAccount[],
  cacheByPlatform: Map<string, StoredPlatformCache>
): PlatformAnalyticsStatus[] {
  return accounts.map((account) => {
    const cached = cacheByPlatform.get(account.platform);
    const cacheError = cached?.lastError ?? null;
    const needsReconnect = platformNeedsReconnect({
      connectionStatus: account.connectionStatus,
      syncError: account.syncError,
      cacheError,
    });
    return {
      platform: account.platform,
      connectedViaOAuth: account.connectionStatus === "connected_oauth",
      needsReconnect,
      reconnectReason: needsReconnect
        ? cacheError ||
          account.syncError ||
          "Reconnect this platform to refresh stats."
        : null,
      updatedAt: cached?.fetchedAt ?? account.lastSyncedAt,
      hasStoredCache: Boolean(cached),
    };
  });
}

export function snapshotsFromCache(
  cacheRows: StoredPlatformCache[]
): PlatformContentSnapshot[] {
  return cacheRows.map((row) => ({
    platform: row.platform,
    items: row.items,
    connectedViaOAuth: true,
  }));
}

export function audienceSizesFromCache(
  cacheRows: StoredPlatformCache[]
): Map<string, number | null> {
  const sizes = new Map<string, number | null>();
  for (const row of cacheRows) {
    sizes.set(row.platform, row.audienceSize);
  }
  return sizes;
}

export function latestCacheTimestamp(
  cacheRows: StoredPlatformCache[]
): string | null {
  let latest: string | null = null;
  for (const row of cacheRows) {
    if (!latest || row.fetchedAt > latest) latest = row.fetchedAt;
  }
  return latest;
}
