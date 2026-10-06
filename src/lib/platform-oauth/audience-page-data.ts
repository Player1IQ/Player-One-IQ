import { cache } from "react";
import { getCreatorPlatformAccounts } from "@/lib/creator-revenue/queries";
import { isOAuthPlatform } from "./types";
import {
  audienceSizesFromCache,
  buildPlatformAnalyticsStatuses,
  latestCacheTimestamp,
  loadCreatorPlatformContentCache,
  platformsNeedingFirstFetch,
  snapshotsFromCache,
  type PlatformAnalyticsStatus,
  type StoredPlatformCache,
} from "./content-cache";
import {
  buildCreatorAudienceAnalytics,
  type CreatorAudienceAnalytics,
} from "./creator-analytics";
import type { PlatformContentSnapshot } from "./content-performance";
import { listLatestCreatorPlatformMetrics } from "./metric-history";

export const EMPTY_CREATOR_AUDIENCE_ANALYTICS: CreatorAudienceAnalytics = {
  platformBreakdown: [],
  contentTrend: [],
  weeklyViewsTrend: [],
  totalViews: 0,
  totalContent: 0,
  hasOAuthContent: false,
  connectedOAuthCount: 0,
};

export interface CreatorAudiencePageData {
  analytics: CreatorAudienceAnalytics;
  snapshots: PlatformContentSnapshot[];
  updatedAt: string | null;
  platforms: PlatformAnalyticsStatus[];
  needsFirstFetch: boolean;
}

export const getCreatorAudiencePageData = cache(
  async (creatorId: string): Promise<CreatorAudiencePageData> => {
  const accounts = await getCreatorPlatformAccounts(creatorId);
  const connected = accounts.filter(
    (account) => account.connectionStatus === "connected_oauth"
  );
  const [cacheRows, latestMetrics] = await Promise.all([
    loadCreatorPlatformContentCache(creatorId),
    listLatestCreatorPlatformMetrics(creatorId),
  ]);

  const cacheByPlatform = new Map<string, StoredPlatformCache>();
  for (const row of cacheRows) {
    cacheByPlatform.set(row.platform, row);
  }

  const snapshots = snapshotsFromCache(cacheRows);
  const audienceSizes = audienceSizesFromCache(cacheRows);

  for (const account of connected) {
    if (!isOAuthPlatform(account.platform)) continue;
    if (cacheByPlatform.has(account.platform)) continue;
    snapshots.push({
      platform: account.platform,
      items: [],
      connectedViaOAuth: true,
    });
    const metric = latestMetrics.get(account.platform);
    audienceSizes.set(account.platform, metric?.audienceSize ?? null);
  }

  const analytics = buildCreatorAudienceAnalytics(snapshots, audienceSizes);

  for (const row of analytics.platformBreakdown) {
    if (row.contentCount > 0) continue;
    const metric = latestMetrics.get(row.platform);
    if (!metric) continue;
    row.contentCount = metric.contentCount ?? 0;
    row.totalViews = metric.viewTotal ?? 0;
    row.avgViews =
      row.contentCount > 0
        ? Math.round((metric.viewTotal ?? 0) / row.contentCount)
        : 0;
    if (row.audienceSize == null) {
      row.audienceSize = metric.audienceSize;
    }
  }

  analytics.totalViews = analytics.platformBreakdown.reduce(
    (sum, row) => sum + row.totalViews,
    0
  );
  analytics.totalContent = analytics.platformBreakdown.reduce(
    (sum, row) => sum + row.contentCount,
    0
  );
  analytics.connectedOAuthCount = Math.max(
    analytics.connectedOAuthCount,
    connected.length
  );

  const latestMetricOn = [...latestMetrics.values()]
    .map((row) => row.capturedOn)
    .sort()
    .at(-1);

  return {
    analytics,
    snapshots,
    updatedAt:
      latestCacheTimestamp(cacheRows) ??
      (latestMetricOn ? `${latestMetricOn}T12:00:00.000Z` : null),
    platforms: buildPlatformAnalyticsStatuses(accounts, cacheByPlatform),
    needsFirstFetch:
      platformsNeedingFirstFetch(
        connected.map((account) => account.platform),
        cacheRows.map((row) => row.platform)
      ).length > 0,
  };
  }
);
