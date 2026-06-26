import type { ConversationType } from "./types";
import { getContractById } from "@/lib/contracts/queries";
import {
  contractStatusLabels,
  formatCurrency,
} from "../contracts/types";
import {
  getApplicationsForOpportunity,
  getOpportunityById,
} from "@/lib/opportunities/queries";
import {
  opportunityStatusLabels,
} from "../opportunities/types";

export interface DealRoomContextDetail {
  label: string;
  value: string;
}

export interface DealRoomContext {
  type: Exclude<ConversationType, "direct" | "group">;
  relatedId: string;
  title: string;
  href: string;
  status: string;
  statusLabel: string;
  summary: string;
  details: DealRoomContextDetail[];
}

export async function getDealRoomContext(
  type: Exclude<ConversationType, "direct" | "group">,
  relatedId: string
): Promise<DealRoomContext | null> {
  if (type === "opportunity") {
    const [opportunity, applications] = await Promise.all([
      getOpportunityById(relatedId),
      getApplicationsForOpportunity(relatedId),
    ]);

    if (!opportunity) return null;

    const pending = applications.filter((app) =>
      ["applied", "under_review"].includes(app.status)
    ).length;

    return {
      type: "opportunity",
      relatedId,
      title: opportunity.title,
      href: `/opportunities/${relatedId}`,
      status: opportunity.status,
      statusLabel: opportunityStatusLabels[opportunity.status],
      summary: "Coordinate with your team on applications, shortlists, and next steps.",
      details: [
        { label: "Budget", value: opportunity.budgetDisplay },
        { label: "Platform", value: opportunity.platform },
        { label: "Applications", value: String(applications.length) },
        { label: "Pending review", value: String(pending) },
      ],
    };
  }

  const contract = await getContractById(relatedId);
  if (!contract) return null;

  return {
    type: "contract",
    relatedId,
    title: contract.contractName,
    href: `/contracts/${relatedId}`,
    status: contract.status,
    statusLabel: contractStatusLabels[contract.status],
    summary: "Discuss terms, negotiation updates, and delivery with your team.",
    details: [
      { label: "Parties", value: `${contract.creatorName} × ${contract.sponsorName}` },
      { label: "Value", value: formatCurrency(contract.contractValue) },
      { label: "Start", value: contract.startDateDisplay },
      { label: "End", value: contract.endDateDisplay },
    ],
  };
}
