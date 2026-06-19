import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ContractDetail } from "@/components/contracts/ContractDetail";
import { canRunLiveAi } from "@/lib/ai/credentials";
import { getOrganizationId } from "@/lib/organization/queries";
import { findConversationByRelated } from "@/lib/messages/queries";
import { getContractById, getContractNegotiationContext } from "@/lib/contracts/queries";
import { getDeliverablesForContract } from "@/lib/contract-deliverables/queries";
import { getCreators } from "@/lib/creators/queries";
import { getSponsors } from "@/lib/sponsors/queries";
import { canWriteData, getCurrentUserRole } from "@/lib/permissions";
import { getSubscriptionContext } from "@/lib/subscription/queries";
import { hasFeature } from "@/lib/subscription/features";

interface ContractDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContractDetailPage({
  params,
}: ContractDetailPageProps) {
  const { id } = await params;
  const [contract, creators, sponsors, role, deliverables, subscription, dealRoomConversationId] =
    await Promise.all([
      getContractById(id),
      getCreators(),
      getSponsors(),
      getCurrentUserRole(),
      getDeliverablesForContract(id),
      getSubscriptionContext(),
      findConversationByRelated("contract", id),
    ]);

  if (!contract) {
    notFound();
  }

  const negotiationContext = await getContractNegotiationContext(contract);
  const organizationId = await getOrganizationId();
  const aiLive =
    Boolean(organizationId) && (await canRunLiveAi(organizationId!));

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
        canWrite={canWriteData(role)}
        canUseAi={hasFeature(subscription.features, "ai_contract_summaries")}
        aiMode={aiLive ? "live" : "demo"}
        dealRoomConversationId={dealRoomConversationId}
      />
    </DashboardLayout>
  );
}
