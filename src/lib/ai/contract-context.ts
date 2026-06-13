import { buildDeliverablesSummary } from "@/lib/contract-deliverables";
import { getDeliverablesForContract } from "@/lib/contract-deliverables/queries";
import {
  contractStatusLabels,
  isContractOverdue,
  isExpiringSoon,
} from "@/lib/contracts";
import {
  getContractById,
  getContractNegotiationContext,
} from "@/lib/contracts/queries";
import { getOpportunityById } from "@/lib/opportunities/queries";

export interface ContractSummaryContext {
  contract: {
    id: string;
    name: string;
    status: string;
    statusLabel: string;
    value: number;
    valueDisplay: string;
    startDate: string | null;
    endDate: string | null;
    creatorName: string;
    sponsorName: string;
    notes: string | null;
    isOverdue: boolean;
    isExpiringSoon: boolean;
    sourceOpportunityId: string | null;
  };
  deliverables: {
    items: Array<{
      title: string;
      status: string;
      dueDate: string | null;
      isOverdue: boolean;
    }>;
    summary: {
      total: number;
      completed: number;
      progressPercent: number;
    };
  };
  negotiation: {
    proposedRate: number | null;
    opportunityBudget: number | null;
    opportunityTitle: string | null;
  } | null;
  sourceOpportunityTitle: string | null;
}

export async function buildContractSummaryContext(
  contractId: string
): Promise<ContractSummaryContext | null> {
  const contract = await getContractById(contractId);
  if (!contract) return null;

  const [deliverables, negotiationContext] = await Promise.all([
    getDeliverablesForContract(contractId),
    getContractNegotiationContext(contract),
  ]);

  let sourceOpportunityTitle = negotiationContext?.opportunityTitle ?? null;
  if (!sourceOpportunityTitle && contract.sourceOpportunityId) {
    const opportunity = await getOpportunityById(contract.sourceOpportunityId);
    sourceOpportunityTitle = opportunity?.title ?? null;
  }

  const deliverablesSummary = buildDeliverablesSummary(deliverables);

  return {
    contract: {
      id: contract.id,
      name: contract.contractName,
      status: contract.status,
      statusLabel: contractStatusLabels[contract.status],
      value: contract.contractValue,
      valueDisplay: contract.valueDisplay,
      startDate: contract.startDate,
      endDate: contract.endDate,
      creatorName: contract.creatorName,
      sponsorName: contract.sponsorName,
      notes: contract.notes?.trim() || null,
      isOverdue: isContractOverdue(contract),
      isExpiringSoon: isExpiringSoon(contract),
      sourceOpportunityId: contract.sourceOpportunityId,
    },
    deliverables: {
      items: deliverables.map((d) => ({
        title: d.title,
        status: d.displayStatus,
        dueDate: d.dueDate,
        isOverdue: d.isOverdue,
      })),
      summary: {
        total: deliverablesSummary.total,
        completed: deliverablesSummary.completed,
        progressPercent: deliverablesSummary.progressPercent,
      },
    },
    negotiation: negotiationContext
      ? {
          proposedRate: negotiationContext.proposedRate,
          opportunityBudget: negotiationContext.opportunityBudget,
          opportunityTitle: negotiationContext.opportunityTitle,
        }
      : null,
    sourceOpportunityTitle,
  };
}
