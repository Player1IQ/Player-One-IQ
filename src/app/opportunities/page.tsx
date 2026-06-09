import { DashboardLayout } from "@/components/DashboardLayout";
import { OpportunitiesPageClient } from "@/components/opportunities/OpportunitiesPageClient";
import { getOpportunities } from "@/lib/opportunities/queries";
import { getCurrentUserRole, canManageOpportunities } from "@/lib/permissions";

export default async function OpportunitiesPage() {
  const [opportunities, role] = await Promise.all([
    getOpportunities(),
    getCurrentUserRole(),
  ]);

  return (
    <DashboardLayout
      title="Opportunities"
      description="Browse and manage sponsorship opportunities"
    >
      <OpportunitiesPageClient
        opportunities={opportunities}
        canManage={canManageOpportunities(role)}
      />
    </DashboardLayout>
  );
}
