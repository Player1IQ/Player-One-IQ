import { formatCurrency, type ContractStatus, contractStatusLabels } from "@/lib/contracts";

export function buildContractNegotiationMessage(params: {
  contractName: string;
  sponsorName: string;
  creatorName: string;
  previousValue: number;
  contractValue: number;
  status: ContractStatus;
  negotiationNote?: string;
}): string {
  const valueLine =
    params.previousValue !== params.contractValue
      ? `Proposed value: ${formatCurrency(params.contractValue)} (previously ${formatCurrency(params.previousValue)})`
      : `Proposed value: ${formatCurrency(params.contractValue)}`;

  const lines = [
    "Contract terms updated — please review",
    "",
    `Contract: ${params.contractName}`,
    `Parties: ${params.creatorName} × ${params.sponsorName}`,
    valueLine,
    `Status: ${contractStatusLabels[params.status]}`,
  ];

  if (params.negotiationNote?.trim()) {
    lines.push("", `Note: ${params.negotiationNote.trim()}`);
  }

  lines.push(
    "",
    "Reply in this deal room if these terms work for your side."
  );

  return lines.join("\n");
}
