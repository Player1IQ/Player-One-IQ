import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CreatorProfile } from "@/components/creators/CreatorProfile";
import { getCreatorById } from "@/lib/creators/queries";
import { getContracts } from "@/lib/contracts/queries";
import {
  getCreatorPlatformAccounts,
  getCreatorRevenueEntries,
} from "@/lib/creator-revenue/queries";
import { getCreatorPaidContractPaymentsForMonth } from "@/lib/payments/queries";
import { canRunLiveAi } from "@/lib/ai/credentials";
import { getOrganizationId } from "@/lib/organization/queries";
import {
  canAccessCreator,
  getCurrentUserMembership,
  hasFullAccess,
  getCurrentUserRole,
} from "@/lib/permissions";
import { isCreatorPortalRole, isPortalRole } from "@/lib/team";
import { getOAuthPlatformUi } from "@/lib/platform-oauth/config";
import { getCreatorAudienceAnalytics } from "@/lib/platform-oauth/creator-analytics";
import { getSubscriptionContext } from "@/lib/subscription/queries";
import { createClient } from "@/lib/supabase/server";
import { loadMediaKitForCreator } from "@/lib/media-kit/store";
import {
  creatorContentAnalysisFeatureKeys,
  hasAnyFeature,
  hasFeature,
} from "@/lib/subscription/features";
import { getPeriodMonthFromSearchParams } from "@/lib/revenue/monthly";

interface CreatorDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    oauth_success?: string;
    oauth_error?: string;
    month?: string;
  }>;
}

export default async function CreatorDetailPage({
  params,
  searchParams,
}: CreatorDetailPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const { oauth_success: oauthSuccess, oauth_error: oauthError } =
    resolvedSearchParams;
  const periodMonth = getPeriodMonthFromSearchParams(resolvedSearchParams);

  const [
    creator,
    role,
    membership,
    contracts,
    platformAccounts,
    revenueEntries,
    subscription,
    audienceAnalytics,
    payments,
  ] = await Promise.all([
    getCreatorById(id),
    getCurrentUserRole(),
    getCurrentUserMembership(),
    getContracts(),
    getCreatorPlatformAccounts(id),
    getCreatorRevenueEntries(id, periodMonth),
    getSubscriptionContext(),
    getCreatorAudienceAnalytics(id),
    getCreatorPaidContractPaymentsForMonth(id, periodMonth),
  ]);

  if (!creator) {
    notFound();
  }

  if (!(await canAccessCreator(id))) {
    notFound();
  }

  const organizationId = await getOrganizationId();
  const aiLive =
    Boolean(organizationId) && (await canRunLiveAi(organizationId!));

  const subtitle =
    creator.socialHandles[0]?.handle ?? creator.email ?? undefined;

  const isPortalUser = isPortalRole(role);
  const canWriteRevenue =
    hasFullAccess(role, "creators") ||
    (isCreatorPortalRole(role) && membership?.linkedCreatorId === id);
  const canManageMediaKit = canWriteRevenue;
  const supabase = canManageMediaKit ? await createClient() : null;
  const mediaKit =
    canManageMediaKit && supabase && organizationId
      ? await loadMediaKitForCreator(supabase, id, organizationId)
      : null;

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
        canWrite={hasFullAccess(role, "creators")}
        canWriteRevenue={canWriteRevenue}
        canManageMediaKit={canManageMediaKit}
        mediaKit={mediaKit}
        isPortalUser={isPortalUser}
        isContentCreator={isCreatorPortalRole(role)}
        canUseContentAi={hasAnyFeature(
          subscription.features,
          creatorContentAnalysisFeatureKeys
        )}
        aiMode={aiLive ? "live" : "demo"}
        audienceAnalytics={audienceAnalytics}
        canViewAnalytics={hasAnyFeature(subscription.features, [
          "limited_analytics",
          "advanced_analytics",
        ])}
        canViewAdvancedAnalytics={hasFeature(
          subscription.features,
          "advanced_analytics"
        )}
        periodMonth={periodMonth}
        payments={payments}
      />
    </DashboardLayout>
  );
}
