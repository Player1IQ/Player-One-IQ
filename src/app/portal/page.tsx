import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PortalHomeClient } from "@/components/portal/PortalHomeClient";
import { PortalNoProfileClient } from "@/components/portal/PortalNoProfileClient";
import { getCampaigns } from "@/lib/campaigns/queries";
import { getCreatorById } from "@/lib/creators/queries";
import { getPortalDeliverableMetrics } from "@/lib/contract-deliverables/queries";
import { getContracts } from "@/lib/contracts/queries";
import { getUnreadMessageCount } from "@/lib/messages/queries";
import { getOrganizationForUser } from "@/lib/organization/queries";
import { roleLabels, isPortalRole } from "@/lib/team";
import { getCurrentUserMembership } from "@/lib/permissions";

export default async function PortalHomePage() {
  const membership = await getCurrentUserMembership();
  if (!membership || !isPortalRole(membership.role)) {
    redirect("/");
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

  const [creator, contracts, unreadMessages, organization, campaigns, deliverableMetrics] =
    await Promise.all([
      getCreatorById(membership.linkedCreatorId),
      getContracts(),
      getUnreadMessageCount(),
      getOrganizationForUser(),
      showCampaigns ? getCampaigns() : Promise.resolve([]),
      getPortalDeliverableMetrics(membership.linkedCreatorId),
    ]);

  if (!creator) {
    redirect("/");
  }

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
        roleLabel={roleLabels[membership.role]}
        showCampaigns={showCampaigns}
        campaignCount={campaigns.length}
        deliverableMetrics={deliverableMetrics}
      />
    </DashboardLayout>
  );
}
