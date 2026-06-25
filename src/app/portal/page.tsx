import { redirect } from "next/navigation";
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
import { getCurrentUserMembership } from "@/lib/permissions";
import { syncPortalUserToSponsorDealRooms } from "@/app/messages/actions";
import { getSubscriptionContext } from "@/lib/subscription/queries";
import { hasFeature } from "@/lib/subscription/features";

export default async function PortalHomePage() {
  const membership = await getCurrentUserMembership();
  if (!membership || !isPortalRole(membership.role)) {
    redirect("/");
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
      syncPortalUserToSponsorDealRooms(membership.linkedSponsorId).then(() =>
        getUnreadMessageCount()
      ),
      getOrganizationForUser(),
      getCampaigns(),
      getSponsorPortalDeliverableMetrics(membership.linkedSponsorId),
      getSubscriptionContext(),
    ]);

    if (!sponsor) {
      redirect("/");
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

  const showCampaigns = isCreatorPortalRole(membership.role);
  const showOpportunities = isCreatorPortalRole(membership.role);

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
  ] = await Promise.all([
    getCreatorById(membership.linkedCreatorId),
    getContracts(),
    getUnreadMessageCount(),
    getOrganizationForUser(),
    showCampaigns ? getCampaigns() : Promise.resolve([]),
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
  ]);

  if (!creator) {
    redirect("/");
  }

  const whiteLabelEnabled = hasFeature(subscription.features, "white_label");
  const opportunityApplicationStats = getApplicationStats(opportunityApplications);
  const portalBenefits = await getCreatorPortalBenefits(
    membership.linkedCreatorId,
    creator,
    contracts,
    revenueEntries,
    platformAccounts.length,
    opportunityApplications,
    deliverableMetrics,
    marketplaceOpportunities
  );

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
      />
    </DashboardLayout>
  );
}
