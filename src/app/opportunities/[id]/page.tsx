import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { OpportunityDetail } from "@/components/opportunities/OpportunityDetail";
import {
  getOpportunityById,
  getApplicationsForOpportunity,
} from "@/lib/opportunities/queries";
import { getCreators } from "@/lib/creators/queries";
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
  const [opportunity, applications, creators, role] = await Promise.all([
    getOpportunityById(id),
    getApplicationsForOpportunity(id),
    getCreators(),
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
        canManage={canManageOpportunities(role)}
        canApply={canApplyToOpportunities(role)}
      />
    </DashboardLayout>
  );
}
