import { applicationStatusLabels, type ApplicationStatus } from "@/lib/opportunities";
import { contractStatusLabels, formatCurrency, type ContractStatus } from "@/lib/contracts";

export function dealRoomOpenedMessage(label: string): string {
  return `${label} deal room opened. Team members can collaborate here.`;
}

export function groupCreatedMessage(title: string): string {
  return `Group chat "${title}" created.`;
}

export function membersAddedMessage(names: string[]): string {
  if (names.length === 0) return "Members added to the conversation.";
  if (names.length === 1) return `${names[0]} joined the conversation.`;
  return `${names.join(", ")} joined the conversation.`;
}

export function memberLeftMessage(name: string): string {
  return `${name} left the conversation.`;
}

export function memberRemovedMessage(name: string): string {
  return `${name} was removed from the conversation.`;
}

export function contractTermsUpdatedMessage(params: {
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
      ? `Value: ${formatCurrency(params.contractValue)} (was ${formatCurrency(params.previousValue)})`
      : `Value: ${formatCurrency(params.contractValue)}`;

  const lines = [
    "Contract terms updated",
    `${params.contractName} · ${params.creatorName} × ${params.sponsorName}`,
    valueLine,
    `Status: ${contractStatusLabels[params.status]}`,
  ];

  if (params.negotiationNote?.trim()) {
    lines.push(`Note: ${params.negotiationNote.trim()}`);
  }

  return lines.join("\n");
}

export function applicationSubmittedMessage(params: {
  creatorName: string;
  opportunityTitle: string;
  proposedRate?: number | null;
}): string {
  const rate =
    params.proposedRate != null && params.proposedRate > 0
      ? ` · Proposed rate: ${formatCurrency(params.proposedRate)}`
      : "";
  return `${params.creatorName} applied to ${params.opportunityTitle}${rate}`;
}

export function applicationStatusChangedMessage(params: {
  creatorName: string;
  opportunityTitle: string;
  status: ApplicationStatus;
  contractName?: string;
}): string {
  const statusLabel = applicationStatusLabels[params.status];
  if (params.status === "accepted" && params.contractName) {
    return `Application accepted — ${params.creatorName} for ${params.opportunityTitle}. Draft contract "${params.contractName}" created.`;
  }
  return `Application ${statusLabel.toLowerCase()} — ${params.creatorName} for ${params.opportunityTitle}`;
}
