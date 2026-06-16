import { DashboardLayout } from "@/components/DashboardLayout";
import { ApplicationsPageClient } from "@/components/opportunities/ApplicationsPageClient";
import { getAllApplications } from "@/lib/opportunities/queries";
import { getOrganizationForUser } from "@/lib/organization/queries";
import { getCurrentUserRole, canManageOpportunities } from "@/lib/permissions";

export default async function ApplicationsPage() {
  const [applications, role, organization] = await Promise.all([
    getAllApplications(),
    getCurrentUserRole(),
    getOrganizationForUser(),
  ]);

  return (
    <DashboardLayout
      title="Applications"
      description="Review and manage creator applications across your opportunities"
    >
      <ApplicationsPageClient
        applications={applications}
        canManage={canManageOpportunities(role)}
        organizationType={organization?.type}
      />
    </DashboardLayout>
  );
}
