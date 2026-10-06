import { cache } from "react";
import { getCreatorPlatformAccounts } from "@/lib/creator-revenue/queries";
import { isOAuthPlatform, type OAuthPlatform } from "./types";
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
import { recordCreatorPlatformMetricSnapshot } from "./metric-history";

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
}

export const getCreatorAudiencePageData = cache(
  async (creatorId: string): Promise<CreatorAudiencePageData> => {
  const accounts = await getCreatorPlatformAccounts(creatorId);
  const connected = accounts.filter(
    (account) => account.connectionStatus === "connected_oauth"
  );
  let cacheRows = await loadCreatorPlatformContentCache(creatorId);

  const missing = platformsNeedingFirstFetch(
    connected.map((account) => account.platform),
    cacheRows.map((row) => row.platform)
  ).filter((platform): platform is OAuthPlatform => isOAuthPlatform(platform));

  if (missing.length > 0) {
    await Promise.all(
      missing.map(async (platform) => {
        const account = connected.find((row) => row.platform === platform);
        if (!account) return;
        await recordCreatorPlatformMetricSnapshot({
          organizationId: account.organizationId,
          creatorId,
          platform,
          platformAccountId: account.id,
        });
      })
    );
    cacheRows = await loadCreatorPlatformContentCache(creatorId);
  }

  const cacheByPlatform = new Map<string, StoredPlatformCache>();
  for (const row of cacheRows) {
    cacheByPlatform.set(row.platform, row);
  }

  const snapshots = snapshotsFromCache(cacheRows);
  const analytics = buildCreatorAudienceAnalytics(
    snapshots,
    audienceSizesFromCache(cacheRows)
  );

  return {
    analytics: {
      ...analytics,
      connectedOAuthCount: Math.max(
        analytics.connectedOAuthCount,
        connected.length
      ),
    },
    snapshots,
    updatedAt: latestCacheTimestamp(cacheRows),
    platforms: buildPlatformAnalyticsStatuses(accounts, cacheByPlatform),
  };
  }
);
