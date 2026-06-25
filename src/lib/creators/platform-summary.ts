import { getCreatorPlatformAccounts } from "@/lib/creator-revenue/queries";
import { getCreatorAudienceAnalytics } from "@/lib/platform-oauth/creator-analytics";
import type { CreatorPlatformAccount } from "@/lib/creator-revenue";

export interface CreatorPlatformSummary {
  connectedCount: number;
  platforms: CreatorPlatformAccount[];
  totalRecentViews: number | null;
  totalAudience: number | null;
  hasOAuthContent: boolean;
  youtubeConnected: boolean;
}

export async function getCreatorPlatformSummary(
  creatorId: string
): Promise<CreatorPlatformSummary> {
  const [platforms, analytics] = await Promise.all([
    getCreatorPlatformAccounts(creatorId),
    getCreatorAudienceAnalytics(creatorId).catch(() => null),
  ]);

  const youtubeConnected = platforms.some(
    (account) =>
      account.platform === "YouTube" &&
      account.connectionStatus !== "disconnected"
  );

  const audienceTotal =
    analytics?.platformBreakdown
      .map((platform) => platform.audienceSize)
      .filter((size): size is number => size != null && size > 0)
      .reduce((sum, size) => sum + size, 0) ?? 0;

  return {
    connectedCount: platforms.length,
    platforms,
    totalRecentViews: analytics?.hasOAuthContent ? analytics.totalViews : null,
    totalAudience: audienceTotal > 0 ? audienceTotal : null,
    hasOAuthContent: analytics?.hasOAuthContent ?? false,
    youtubeConnected,
  };
}
