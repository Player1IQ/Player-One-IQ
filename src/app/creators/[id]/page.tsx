import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CreatorProfile } from "@/components/creators/CreatorProfile";
import { getCreatorById } from "@/lib/creators/queries";
import { getContracts } from "@/lib/contracts/queries";
import {
  getCreatorPlatformAccounts,
  getCreatorRevenueEntries,
} from "@/lib/creator-revenue/queries";
import { isAiLlmLive } from "@/lib/ai/config";
import { canWriteData, getCurrentUserRole } from "@/lib/permissions";
import { getOAuthPlatformUi } from "@/lib/platform-oauth/config";
import { getCreatorAudienceAnalytics } from "@/lib/platform-oauth/creator-analytics";
import { getSubscriptionContext } from "@/lib/subscription/queries";
import { hasAnyFeature, hasFeature } from "@/lib/subscription/features";

interface CreatorDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ oauth_success?: string; oauth_error?: string }>;
}

export default async function CreatorDetailPage({
  params,
  searchParams,
}: CreatorDetailPageProps) {
  const { id } = await params;
  const { oauth_success: oauthSuccess, oauth_error: oauthError } =
    await searchParams;
  const [
    creator,
    role,
    contracts,
    platformAccounts,
    revenueEntries,
    subscription,
    audienceAnalytics,
  ] = await Promise.all([
    getCreatorById(id),
    getCurrentUserRole(),
    getContracts(),
    getCreatorPlatformAccounts(id),
    getCreatorRevenueEntries(id),
    getSubscriptionContext(),
    getCreatorAudienceAnalytics(id),
  ]);

  if (!creator) {
    notFound();
  }

  const subtitle =
    creator.socialHandles[0]?.handle ?? creator.email ?? undefined;

  return (
    <DashboardLayout title={creator.name} description={subtitle}>
      <CreatorProfile
        creator={creator}
        contracts={contracts.filter((c) => c.creatorId === id)}
        platformAccounts={platformAccounts}
        revenueEntries={revenueEntries}
        oauthPlatformUi={getOAuthPlatformUi()}
        oauthSuccess={oauthSuccess ?? null}
        oauthError={oauthError ?? null}
        canWrite={canWriteData(role)}
        canUseContentAi={hasFeature(subscription.features, "ai_growth")}
        aiMode={isAiLlmLive() ? "live" : "demo"}
        audienceAnalytics={audienceAnalytics}
        canViewAnalytics={hasAnyFeature(subscription.features, [
          "limited_analytics",
          "advanced_analytics",
        ])}
        canViewAdvancedAnalytics={hasFeature(
          subscription.features,
          "advanced_analytics"
        )}
      />
    </DashboardLayout>
  );
}
