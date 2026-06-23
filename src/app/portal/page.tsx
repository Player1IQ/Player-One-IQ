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
} from "@/lib/opportunities/queries";
import { getApplicationStats } from "@/lib/opportunities";
import { getOrganizationForUser } from "@/lib/organization/queries";
import { getSponsorById } from "@/lib/sponsors/queries";
import {
  roleLabels,
  isPortalRole,
  isSponsorPortalRole,
} from "@/lib/team";
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
            roleLabel={roleLabels[membership.role]}
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
          roleLabel={roleLabels[membership.role]}
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
        <PortalNoProfileClient roleLabel={roleLabels[membership.role]} />
      </DashboardLayout>
    );
  }

  const showCampaigns = membership.role === "content_creator";
  const showOpportunities = membership.role === "content_creator";

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
  ]);

  if (!creator) {
    redirect("/");
  }

  const whiteLabelEnabled = hasFeature(subscription.features, "white_label");
  const opportunityApplicationStats = getApplicationStats(opportunityApplications);

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
        roleLabel={roleLabels[membership.role]}
        showCampaigns={showCampaigns}
        campaignCount={campaigns.length}
        showOpportunities={showOpportunities}
        openOpportunityCount={openOpportunities.length}
        pendingApplicationCount={opportunityApplicationStats.needsAction}
        deliverableMetrics={deliverableMetrics}
      />
    </DashboardLayout>
  );
}
