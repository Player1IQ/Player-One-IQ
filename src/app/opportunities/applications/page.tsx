import { DashboardLayout } from "@/components/DashboardLayout";
import { ApplicationsPageClient } from "@/components/opportunities/ApplicationsPageClient";
import {
  getAllApplications,
  getApplicationsForCreator,
} from "@/lib/opportunities/queries";
import { getOrganizationForUser } from "@/lib/organization/queries";
import {
  getCurrentUserMembership,
  canManageOpportunities,
} from "@/lib/permissions";
import { isPortalRole } from "@/lib/team";

export default async function ApplicationsPage() {
  const membership = await getCurrentUserMembership();

  const isPortalUser = Boolean(membership && isPortalRole(membership.role));
  const linkedCreatorId = membership?.linkedCreatorId ?? null;

  const [applications, organization] = await Promise.all([
    isPortalUser && linkedCreatorId
      ? getApplicationsForCreator(linkedCreatorId)
      : getAllApplications(),
    getOrganizationForUser(),
  ]);

  return (
    <DashboardLayout
      title={isPortalUser ? "My applications" : "Applications"}
      description={
        isPortalUser
          ? "Track the status of your opportunity applications"
          : "Review and manage creator applications across your opportunities"
      }
    >
      <ApplicationsPageClient
        applications={applications}
        canManage={canManageOpportunities(membership?.role ?? null)}
        organizationType={organization?.type}
        isPortalUser={isPortalUser}
      />
    </DashboardLayout>
  );
}
