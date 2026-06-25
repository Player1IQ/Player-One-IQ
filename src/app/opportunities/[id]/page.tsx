import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { OpportunityDetail } from "@/components/opportunities/OpportunityDetail";
import { findConversationByRelated } from "@/lib/messages/queries";
import {
  getOpportunityById,
  getApplicationsForOpportunity,
  getApplicationForCreatorOnOpportunity,
} from "@/lib/opportunities/queries";
import { getCreators } from "@/lib/creators/queries";
import { getSponsors } from "@/lib/sponsors/queries";
import {
  getCurrentUserMembership,
  canManageOpportunities,
  canApplyToOpportunities,
} from "@/lib/permissions";
import { isPortalRole } from "@/lib/team";

interface OpportunityDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OpportunityDetailPage({
  params,
}: OpportunityDetailPageProps) {
  const { id } = await params;
  const membership = await getCurrentUserMembership();

  const isPortalUser = Boolean(membership && isPortalRole(membership.role));
  const linkedCreatorId = membership?.linkedCreatorId ?? null;

  const [
    opportunity,
    applications,
    creators,
    sponsors,
    dealRoomConversationId,
    ownApplication,
  ] = await Promise.all([
    getOpportunityById(id),
    isPortalUser ? Promise.resolve([]) : getApplicationsForOpportunity(id),
    isPortalUser && linkedCreatorId
      ? getCreators().then((all) =>
          all.filter((creator) => creator.id === linkedCreatorId)
        )
      : getCreators(),
    isPortalUser ? Promise.resolve([]) : getSponsors(),
    isPortalUser ? Promise.resolve(null) : findConversationByRelated("opportunity", id),
    isPortalUser && linkedCreatorId
      ? getApplicationForCreatorOnOpportunity(id, linkedCreatorId)
      : Promise.resolve(null),
  ]);

  if (!opportunity) notFound();

  if (isPortalUser && opportunity.status !== "open") {
    notFound();
  }

  const portalApplications = ownApplication ? [ownApplication] : [];

  return (
    <DashboardLayout
      title={opportunity.title}
      description={`${opportunity.category} · ${opportunity.platform}`}
    >
      <OpportunityDetail
        opportunity={opportunity}
        applications={isPortalUser ? portalApplications : applications}
        creators={creators}
        sponsors={sponsors}
        canManage={canManageOpportunities(membership?.role ?? null)}
        canApply={canApplyToOpportunities(membership?.role ?? null)}
        dealRoomConversationId={dealRoomConversationId}
        isPortalUser={isPortalUser}
        linkedCreatorId={linkedCreatorId}
        hasApplied={Boolean(ownApplication)}
      />
    </DashboardLayout>
  );
}
