import { DashboardLayout } from "@/components/DashboardLayout";
import { OpportunitiesPageClient } from "@/components/opportunities/OpportunitiesPageClient";
import { getOpportunities } from "@/lib/opportunities/queries";
import { getSponsors } from "@/lib/sponsors/queries";
import { getCurrentUserRole, canManageOpportunities } from "@/lib/permissions";

export default async function OpportunitiesPage() {
  const [opportunities, sponsors, role] = await Promise.all([
    getOpportunities(),
    getSponsors(),
    getCurrentUserRole(),
  ]);

  return (
    <DashboardLayout
      title="Opportunities"
      description="Browse and manage sponsorship opportunities"
    >
      <OpportunitiesPageClient
        opportunities={opportunities}
        sponsors={sponsors}
        canManage={canManageOpportunities(role)}
      />
    </DashboardLayout>
  );
}
