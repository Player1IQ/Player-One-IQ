import { DashboardLayout } from "@/components/DashboardLayout";
import { SubscriptionPageGate } from "@/components/subscription/SubscriptionPageGate";
import { PlanBillingSection } from "@/components/subscription/PlanBillingSection";
import { CampaignsPageClient } from "@/components/campaigns/CampaignsPageClient";
import { getCampaigns } from "@/lib/campaigns/queries";
import { getSponsors } from "@/lib/sponsors/queries";
import { getOpportunities } from "@/lib/opportunities/queries";
import {
  hasFullAccess,
  getCurrentUserMembership,
  getCurrentUserRole,
} from "@/lib/permissions";
import { isPortalRole } from "@/lib/team";
import { getOrganizationForUser } from "@/lib/organization/queries";
import { isSponsorBrandOrganizationType } from "@/lib/organization/constants";
import { ensureSponsorBrandProfile } from "@/lib/organization/sponsor-setup";

export default async function CampaignsPage() {
  const membership = await getCurrentUserMembership();
  const organization = await getOrganizationForUser();

  const isPortalUser = Boolean(membership && isPortalRole(membership.role));
  const isSponsorOrg = isSponsorBrandOrganizationType(organization?.type);

  if (isSponsorOrg && !isPortalUser) {
    await ensureSponsorBrandProfile();
  }

  const [campaigns, sponsors, opportunities, role] = await Promise.all([
    getCampaigns(),
    isPortalUser ? Promise.resolve([]) : getSponsors(),
    isPortalUser ? Promise.resolve([]) : getOpportunities(),
    getCurrentUserRole(),
  ]);

  return (
    <DashboardLayout
      title={isPortalUser ? "Your campaigns" : "Campaigns"}
      description={
        isPortalUser
          ? "Campaigns you are assigned to"
          : "Track sponsor campaign budgets, status, and linked opportunities"
      }
    >
      <SubscriptionPageGate
        required="campaign_tracking"
        featureLabel="Campaign tracking"
      >
        <div className="space-y-6">
          {!isPortalUser ? (
            <PlanBillingSection highlightMetrics={["campaigns"]} />
          ) : null}
          <CampaignsPageClient
            campaigns={campaigns}
            sponsors={sponsors}
            opportunities={opportunities}
            canWrite={hasFullAccess(role, "campaigns")}
            isPortalUser={isPortalUser}
            isSponsorOrg={isSponsorOrg}
            defaultSponsorId={isSponsorOrg ? sponsors[0]?.id : undefined}
          />
        </div>
      </SubscriptionPageGate>
    </DashboardLayout>
  );
}
