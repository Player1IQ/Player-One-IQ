import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ContractDetail } from "@/components/contracts/ContractDetail";
import { canRunLiveAi } from "@/lib/ai/credentials";
import { getOrganizationId } from "@/lib/organization/queries";
import { syncPortalUserToContractDealRooms } from "@/app/messages/actions";
import { findConversationByRelated } from "@/lib/messages/queries";
import { getCampaignsForContract } from "@/lib/campaigns/contract-links";
import { getContractById, getContractNegotiationContext } from "@/lib/contracts/queries";
import { getDeliverablesForContract } from "@/lib/contract-deliverables/queries";
import { getCreators } from "@/lib/creators/queries";
import { getSponsors } from "@/lib/sponsors/queries";
import {
  canAccessContract,
  canUpdateDeliverable,
  hasFullAccess,
  getCurrentUserMembership,
} from "@/lib/permissions";
import { isPortalRole } from "@/lib/team";
import { getSubscriptionContext } from "@/lib/subscription/queries";
import { hasFeature } from "@/lib/subscription/features";

interface ContractDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContractDetailPage({
  params,
}: ContractDetailPageProps) {
  const { id } = await params;
  const membership = await getCurrentUserMembership();
  const role = membership?.role ?? null;
  const isPortalUser = isPortalRole(role);

  const [contract, creators, sponsors, deliverables, subscription, dealRoomConversationId] =
    await Promise.all([
      getContractById(id),
      getCreators(),
      getSponsors(),
      getDeliverablesForContract(id),
      getSubscriptionContext(),
      findConversationByRelated("contract", id),
    ]);

  if (!contract) {
    notFound();
  }

  if (!(await canAccessContract(contract))) {
    notFound();
  }

  if (isPortalUser && membership?.linkedCreatorId === contract.creatorId) {
    await syncPortalUserToContractDealRooms(contract.creatorId);
  }

  const resolvedDealRoomConversationId = isPortalUser
    ? await findConversationByRelated("contract", id)
    : dealRoomConversationId;

  const negotiationContext = isPortalUser
    ? null
    : await getContractNegotiationContext(contract);
  const relatedCampaigns = await getCampaignsForContract(contract);
  const organizationId = await getOrganizationId();
  const aiLive =
    Boolean(organizationId) && (await canRunLiveAi(organizationId!));
  const canWrite = hasFullAccess(role, "contracts");
  const canUpdateStatus = canUpdateDeliverable(membership, {
    creatorId: contract.creatorId,
  });

  return (
    <DashboardLayout
      title={contract.contractName}
      description={`${contract.creatorName} × ${contract.sponsorName}`}
    >
      <ContractDetail
        contract={contract}
        creators={creators}
        sponsors={sponsors}
        negotiationContext={negotiationContext}
        deliverables={deliverables}
        relatedCampaigns={relatedCampaigns}
        canWrite={canWrite}
        canUpdateStatus={canUpdateStatus}
        isPortalUser={isPortalUser}
        canUseAi={hasFeature(subscription.features, "ai_contract_summaries")}
        aiMode={aiLive ? "live" : "demo"}
        dealRoomConversationId={resolvedDealRoomConversationId}
      />
    </DashboardLayout>
  );
}
