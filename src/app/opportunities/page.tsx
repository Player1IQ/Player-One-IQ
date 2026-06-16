import { DashboardLayout } from "@/components/DashboardLayout";
import { OpportunitiesPageClient } from "@/components/opportunities/OpportunitiesPageClient";
import { getOpportunities, getAllApplications } from "@/lib/opportunities/queries";
import { getApplicationStats } from "@/lib/opportunities";
import { getSponsors } from "@/lib/sponsors/queries";
import { getCurrentUserRole, canManageOpportunities } from "@/lib/permissions";

export default async function OpportunitiesPage() {
  const [opportunities, sponsors, role, applications] = await Promise.all([
    getOpportunities(),
    getSponsors(),
    getCurrentUserRole(),
    getAllApplications(),
  ]);

  const pendingReviewCount = getApplicationStats(applications).needsAction;

  return (
    <DashboardLayout
      title="Opportunities"
      description="Browse and manage sponsorship opportunities"
    >
      <OpportunitiesPageClient
        opportunities={opportunities}
        sponsors={sponsors}
        canManage={canManageOpportunities(role)}
        pendingReviewCount={pendingReviewCount}
      />
    </DashboardLayout>
  );
}
