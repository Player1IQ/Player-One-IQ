import { getCreatorPlatformAccounts } from "@/lib/creator-revenue/queries";
import { getCreatorAudienceAnalytics } from "@/lib/platform-oauth/creator-analytics";
import type { CreatorPlatformAccount } from "@/lib/creator-revenue";

export interface CreatorPlatformSummary {
  connectedCount: number;
  platforms: CreatorPlatformAccount[];
  totalRecentViews: number | null;
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

  return {
    connectedCount: platforms.length,
    platforms,
    totalRecentViews: analytics?.hasOAuthContent ? analytics.totalViews : null,
    hasOAuthContent: analytics?.hasOAuthContent ?? false,
    youtubeConnected,
  };
}
