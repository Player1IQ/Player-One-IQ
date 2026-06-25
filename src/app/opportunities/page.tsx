import { DashboardLayout } from "@/components/DashboardLayout";
import { OpportunitiesPageClient } from "@/components/opportunities/OpportunitiesPageClient";
import {
  getOpportunities,
  getAllApplications,
  getAgencyOpenOpportunitiesForPortal,
  getMarketplaceOpportunities,
  getApplicationsForCreator,
} from "@/lib/opportunities/queries";
import { getApplicationStats } from "@/lib/opportunities";
import { getSponsors } from "@/lib/sponsors/queries";
import {
  getCurrentUserMembership,
  canManageOpportunities,
} from "@/lib/permissions";
import { isPortalRole } from "@/lib/team";

export default async function OpportunitiesPage() {
  const membership = await getCurrentUserMembership();

  const isPortalUser = Boolean(membership && isPortalRole(membership.role));
  const linkedCreatorId = membership?.linkedCreatorId ?? null;

  const [opportunities, agencyOpportunities, marketplaceOpportunities, sponsors, applications] =
    await Promise.all([
    isPortalUser ? Promise.resolve([]) : getOpportunities(),
    isPortalUser ? getAgencyOpenOpportunitiesForPortal() : Promise.resolve([]),
    isPortalUser ? getMarketplaceOpportunities() : Promise.resolve([]),
    isPortalUser ? Promise.resolve([]) : getSponsors(),
    isPortalUser && linkedCreatorId
      ? getApplicationsForCreator(linkedCreatorId)
      : getAllApplications(),
  ]);

  const portalOpportunities = isPortalUser
    ? [...agencyOpportunities, ...marketplaceOpportunities]
    : opportunities;

  const applicationStats = getApplicationStats(applications);

  const pendingReviewCount = applicationStats.needsAction;
  const myApplicationCount = isPortalUser ? applicationStats.total : undefined;
  const myPendingCount = isPortalUser ? applicationStats.needsAction : undefined;

  return (
    <DashboardLayout
      title={isPortalUser ? "Opportunities" : "Opportunities"}
      description={
        isPortalUser
          ? "Browse open sponsorship opportunities and apply with your profile"
          : "Browse and manage sponsorship opportunities"
      }
    >
      <OpportunitiesPageClient
        opportunities={portalOpportunities}
        agencyOpportunities={agencyOpportunities}
        marketplaceOpportunities={marketplaceOpportunities}
        sponsors={sponsors}
        canManage={canManageOpportunities(membership?.role ?? null)}
        pendingReviewCount={pendingReviewCount}
        isPortalUser={isPortalUser}
        myApplicationCount={myApplicationCount}
        myPendingCount={myPendingCount}
      />
    </DashboardLayout>
  );
}
