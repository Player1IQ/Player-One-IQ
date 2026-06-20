import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { OpportunitiesPageClient } from "@/components/opportunities/OpportunitiesPageClient";
import {
  getOpportunities,
  getAllApplications,
  getOpenOpportunitiesForPortal,
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

  if (membership?.role === "player") {
    redirect("/portal");
  }

  const isPortalUser = Boolean(membership && isPortalRole(membership.role));
  const linkedCreatorId = membership?.linkedCreatorId ?? null;

  const [opportunities, sponsors, applications] = await Promise.all([
    isPortalUser
      ? getOpenOpportunitiesForPortal()
      : getOpportunities(),
    isPortalUser ? Promise.resolve([]) : getSponsors(),
    isPortalUser && linkedCreatorId
      ? getApplicationsForCreator(linkedCreatorId)
      : getAllApplications(),
  ]);

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
        opportunities={opportunities}
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
