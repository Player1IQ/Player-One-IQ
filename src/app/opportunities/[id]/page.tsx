import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { OpportunityDetail } from "@/components/opportunities/OpportunityDetail";
import {
  getOpportunityById,
  getApplicationsForOpportunity,
} from "@/lib/opportunities/queries";
import { getCreators } from "@/lib/creators/queries";
import { getSponsors } from "@/lib/sponsors/queries";
import {
  getCurrentUserRole,
  canManageOpportunities,
  canApplyToOpportunities,
} from "@/lib/permissions";

interface OpportunityDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OpportunityDetailPage({
  params,
}: OpportunityDetailPageProps) {
  const { id } = await params;
  const [opportunity, applications, creators, sponsors, role] = await Promise.all([
    getOpportunityById(id),
    getApplicationsForOpportunity(id),
    getCreators(),
    getSponsors(),
    getCurrentUserRole(),
  ]);

  if (!opportunity) notFound();

  return (
    <DashboardLayout
      title={opportunity.title}
      description={`${opportunity.category} · ${opportunity.platform}`}
    >
      <OpportunityDetail
        opportunity={opportunity}
        applications={applications}
        creators={creators}
        sponsors={sponsors}
        canManage={canManageOpportunities(role)}
        canApply={canApplyToOpportunities(role)}
      />
    </DashboardLayout>
  );
}
