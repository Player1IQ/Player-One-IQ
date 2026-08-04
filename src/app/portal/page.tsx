import { redirect } from "next/navigation";
import { STAFF_DASHBOARD_PATH } from "@/lib/routes";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PortalHomeClient } from "@/components/portal/PortalHomeClient";
import { PortalSponsorHomeClient } from "@/components/portal/PortalSponsorHomeClient";
import { PortalNoProfileClient } from "@/components/portal/PortalNoProfileClient";
import { getCampaigns } from "@/lib/campaigns/queries";
import { getCreatorById } from "@/lib/creators/queries";
import {
  getPortalDeliverableMetrics,
  getSponsorPortalDeliverableMetrics,
} from "@/lib/contract-deliverables/queries";
import { getContracts } from "@/lib/contracts/queries";
import { getUnreadMessageCount } from "@/lib/messages/queries";
import {
  getOpenOpportunitiesForPortal,
  getApplicationsForCreator,
  getMarketplaceOpportunities,
} from "@/lib/opportunities/queries";
import { getApplicationStats } from "@/lib/opportunities";
import { getOrganizationForUser } from "@/lib/organization/queries";
import { getSponsorById } from "@/lib/sponsors/queries";
import {
  getPortalRoleLabel,
  isPortalRole,
  isSponsorPortalRole,
  isCreatorPortalRole,
} from "@/lib/team";
import { getCreatorPlatformSummary } from "@/lib/creators/platform-summary";
import { getCreatorPortalBenefits } from "@/lib/creators/portal-benefits";
import {
  getCreatorPlatformAccounts,
  getCreatorRevenueEntries,
} from "@/lib/creator-revenue/queries";
import { isConnectedPlatformAccount } from "@/lib/creator-revenue";
import { getCurrentUserMembership } from "@/lib/permissions";
import { syncPortalUserToSponsorDealRooms } from "@/app/messages/actions";
import { getSubscriptionContext } from "@/lib/subscription/queries";
import { hasFeature } from "@/lib/subscription/features";
import { getTodayScheduleEvents, creatorHasScheduleBlocks } from "@/lib/schedule/queries";
import { getCreatorAudienceAnalytics } from "@/lib/platform-oauth/creator-analytics";
import { fetchCreatorContentSnapshots } from "@/lib/platform-oauth/content-aggregate";
import {
  buildCreatorCoachContext,
  buildCreatorCoachSnapshot,
  getCurrentUserId,
} from "@/lib/creator-coach";
import { getAllCoachStatesForToday } from "@/lib/creator-coach/queries";
import { getCoachProfile } from "@/lib/creator-coach/profile-queries";
import { buildCreatorSeasonView, syncCreatorSeasonXpFromCoach } from "@/lib/creator-seasons";

export default async function PortalHomePage() {
  const membership = await getCurrentUserMembership();
  if (!membership || !isPortalRole(membership.role)) {
    redirect(STAFF_DASHBOARD_PATH);
  }

  if (isSponsorPortalRole(membership.role)) {
    if (!membership.linkedSponsorId) {
      return (
        <DashboardLayout title="Portal" description="Your agency portal">
          <PortalNoProfileClient
            roleLabel={getPortalRoleLabel(membership.role)}
            variant="sponsor"
          />
        </DashboardLayout>
      );
    }

    const [
      sponsor,
      contracts,
      unreadMessages,
      organization,
      campaigns,
      deliverableMetrics,
      subscription,
    ] = await Promise.all([
      getSponsorById(membership.linkedSponsorId),
      getContracts(),
      syncPortalUserToSponsorDealRooms(membership.linkedSponsorId, undefined, {
        revalidate: false,
      }).then(() => getUnreadMessageCount()),
      getOrganizationForUser(),
      getCampaigns(),
      getSponsorPortalDeliverableMetrics(membership.linkedSponsorId),
      getSubscriptionContext(),
    ]);

    if (!sponsor) {
      return (
        <DashboardLayout title="Portal" description="Your agency portal">
          <PortalNoProfileClient
            roleLabel={getPortalRoleLabel(membership.role)}
            variant="sponsor"
          />
        </DashboardLayout>
      );
    }

    const whiteLabelEnabled = hasFeature(subscription.features, "white_label");

    return (
      <DashboardLayout
        title="Portal"
        description={`Welcome back, ${sponsor.companyName}`}
      >
        <PortalSponsorHomeClient
          sponsor={sponsor}
          contracts={contracts}
          unreadMessages={unreadMessages}
          organizationName={organization?.name ?? "Your organization"}
          organizationLogoUrl={organization?.logo_url ?? null}
          whiteLabelEnabled={whiteLabelEnabled}
          roleLabel={getPortalRoleLabel(membership.role)}
          campaignCount={campaigns.length}
          deliverableMetrics={deliverableMetrics}
        />
      </DashboardLayout>
    );
  }

  if (!membership.linkedCreatorId) {
    return (
      <DashboardLayout
        title="Portal"
        description="Your agency portal"
      >
        <PortalNoProfileClient roleLabel={getPortalRoleLabel(membership.role)} />
      </DashboardLayout>
    );
  }

  const isCreatorPortal = isCreatorPortalRole(membership.role);
  const showOpportunities = isCreatorPortal;

  const [
    creator,
    contracts,
    unreadMessages,
    organization,
    campaigns,
    deliverableMetrics,
    subscription,
    openOpportunities,
    opportunityApplications,
    platformSummary,
    revenueEntries,
    platformAccounts,
    marketplaceOpportunities,
    todaySchedule,
    hasScheduleBlock,
    audienceAnalytics,
    contentSnapshots,
    userId,
  ] = await Promise.all([
    getCreatorById(membership.linkedCreatorId),
    getContracts(),
    getUnreadMessageCount(),
    getOrganizationForUser(),
    isCreatorPortal ? getCampaigns() : Promise.resolve([]),
    getPortalDeliverableMetrics(membership.linkedCreatorId),
    getSubscriptionContext(),
    showOpportunities ? getOpenOpportunitiesForPortal() : Promise.resolve([]),
    showOpportunities
      ? getApplicationsForCreator(membership.linkedCreatorId)
      : Promise.resolve([]),
    getCreatorPlatformSummary(membership.linkedCreatorId),
    getCreatorRevenueEntries(membership.linkedCreatorId),
    getCreatorPlatformAccounts(membership.linkedCreatorId),
    showOpportunities ? getMarketplaceOpportunities() : Promise.resolve([]),
    getTodayScheduleEvents(),
    creatorHasScheduleBlocks(membership.linkedCreatorId),
    getCreatorAudienceAnalytics(membership.linkedCreatorId).catch(() => null),
    fetchCreatorContentSnapshots(membership.linkedCreatorId).catch(() => []),
    getCurrentUserId(),
  ]);

  const showCampaigns =
    isCreatorPortal && hasFeature(subscription.features, "campaign_tracking");

  if (!creator) {
    return (
      <DashboardLayout
        title="Portal"
        description="Your creator portal"
      >
        <PortalNoProfileClient roleLabel={getPortalRoleLabel(membership.role)} />
      </DashboardLayout>
    );
  }

  const whiteLabelEnabled = hasFeature(subscription.features, "white_label");
  const opportunityApplicationStats = getApplicationStats(opportunityApplications);
  const portalBenefits = await getCreatorPortalBenefits(
    membership.linkedCreatorId,
    creator,
    contracts,
    revenueEntries,
    platformAccounts.filter(isConnectedPlatformAccount).length,
    opportunityApplications,
    deliverableMetrics,
    marketplaceOpportunities,
    openOpportunities,
    hasScheduleBlock
  );

  const coachProfile = userId
    ? await getCoachProfile(userId, membership.linkedCreatorId)
    : null;

  const coachContext = buildCreatorCoachContext({
    creator,
    contracts,
    platformSummary,
    deliverableMetrics,
    profileReadiness: portalBenefits.profileReadiness,
    hasScheduleBlock,
    todayScheduleCount: todaySchedule.length,
    unreadMessages,
    openOpportunityCount: openOpportunities.length,
    pendingApplicationCount: opportunityApplicationStats.needsAction,
    revenueEntryCount: revenueEntries.length,
    analytics: audienceAnalytics,
    contentSnapshots,
    coachProfile,
  });

  const coachSnapshot = userId
    ? await buildCreatorCoachSnapshot({
        userId,
        creatorCoachContext: coachContext,
      })
    : null;

  if (userId && isCreatorPortalRole(membership.role) && membership.linkedCreatorId) {
    const states = await getAllCoachStatesForToday(
      userId,
      membership.linkedCreatorId
    );
    await syncCreatorSeasonXpFromCoach({
      userId,
      creatorId: membership.linkedCreatorId,
      missions: states.map((state) => ({
        mission: state.mission,
        stateId: state.id,
      })),
      completedRecommendations: states.flatMap((state) =>
        state.completedRecommendationIds.map((recommendationId) => ({
          recommendationId,
          stateId: state.id,
          missionDate: state.missionDate,
        }))
      ),
      coachOnboardingCompleted: coachProfile?.onboardingCompleted ?? false,
    });
  }

  const seasonView =
    userId && isCreatorPortalRole(membership.role)
      ? await buildCreatorSeasonView(userId, membership.linkedCreatorId!)
      : null;

  return (
    <DashboardLayout
      title="Portal"
      description={`Welcome back, ${creator.name}`}
    >
      <PortalHomeClient
        creator={creator}
        contracts={contracts}
        unreadMessages={unreadMessages}
        organizationName={organization?.name ?? "Your organization"}
        organizationLogoUrl={organization?.logo_url ?? null}
        whiteLabelEnabled={whiteLabelEnabled}
        roleLabel={getPortalRoleLabel(membership.role)}
        showCampaigns={showCampaigns}
        campaignCount={campaigns.length}
        showOpportunities={showOpportunities}
        openOpportunityCount={openOpportunities.length}
        pendingApplicationCount={opportunityApplicationStats.needsAction}
        deliverableMetrics={deliverableMetrics}
        platformSummary={platformSummary}
        portalBenefits={portalBenefits}
        todaySchedule={todaySchedule}
        coachSnapshot={coachSnapshot}
        coachContext={coachContext}
        coachProfile={coachProfile}
        creatorId={membership.linkedCreatorId}
        seasonView={seasonView}
      />
    </DashboardLayout>
  );
}
