export type ContractStatus =
  | "draft"
  | "negotiating"
  | "active"
  | "completed"
  | "expired"
  | "cancelled";

export const contractStatuses: ContractStatus[] = [
  "draft",
  "negotiating",
  "active",
  "completed",
  "expired",
  "cancelled",
];

export const contractStatusLabels: Record<ContractStatus, string> = {
  draft: "Draft",
  negotiating: "Negotiating",
  active: "Active",
  completed: "Completed",
  expired: "Expired",
  cancelled: "Cancelled",
};

export const allowedStatusTransitions: Record<ContractStatus, ContractStatus[]> =
  {
    draft: ["negotiating", "active", "cancelled"],
    negotiating: ["draft", "active", "cancelled"],
    active: ["completed", "expired", "cancelled"],
    completed: [],
    expired: [],
    cancelled: [],
  };

export function getAllowedStatusTransitions(
  status: ContractStatus
): ContractStatus[] {
  return allowedStatusTransitions[status] ?? [];
}

export function getSelectableStatuses(
  current: ContractStatus,
  isNew: boolean
): ContractStatus[] {
  if (isNew) return contractStatuses;
  return [current, ...getAllowedStatusTransitions(current)];
}

export function canTransitionContractStatus(
  from: ContractStatus,
  to: ContractStatus
): boolean {
  if (from === to) return true;
  return getAllowedStatusTransitions(from).includes(to);
}

export interface ContractRow {
  id: string;
  organization_id: string;
  creator_id: string;
  sponsor_id: string;
  contract_name: string;
  contract_value: number;
  contract_status: ContractStatus;
  start_date: string | null;
  end_date: string | null;
  deliverables: string | null;
  notes: string | null;
  source_opportunity_id: string | null;
  source_application_id: string | null;
  created_at: string;
  updated_at: string;
  creators?: { name: string } | { name: string }[] | null;
  sponsors?: { company_name: string } | { company_name: string }[] | null;
}

export interface Contract {
  id: string;
  organizationId: string;
  creatorId: string;
  sponsorId: string;
  creatorName: string;
  sponsorName: string;
  contractName: string;
  contractValue: number;
  valueDisplay: string;
  status: ContractStatus;
  startDate: string | null;
  endDate: string | null;
  startDateDisplay: string;
  endDateDisplay: string;
  deliverables: string;
  notes: string;
  sourceOpportunityId: string | null;
  sourceApplicationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContractInput {
  creatorId: string;
  sponsorId: string;
  contractName: string;
  contractValue: number;
  status: ContractStatus;
  startDate: string;
  endDate: string;
  deliverables: string;
  notes: string;
}

export interface ContractNegotiationContext {
  proposedRate: number | null;
  proposedRateDisplay: string;
  opportunityBudget: number | null;
  opportunityBudgetDisplay: string;
  opportunityTitle: string | null;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatContractDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso + (iso.includes("T") ? "" : "T00:00:00")).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );
}

function relationName(
  relation: { name?: string; company_name?: string } | { name?: string; company_name?: string }[] | null | undefined,
  field: "name" | "company_name"
): string {
  if (!relation) return "Unknown";
  const row = Array.isArray(relation) ? relation[0] : relation;
  if (!row) return "Unknown";
  return (field === "name" ? row.name : row.company_name) ?? "Unknown";
}

export function mapContractRow(row: ContractRow): Contract {
  const value = Number(row.contract_value) || 0;

  return {
    id: row.id,
    organizationId: row.organization_id,
    creatorId: row.creator_id,
    sponsorId: row.sponsor_id,
    creatorName: relationName(row.creators, "name"),
    sponsorName: relationName(row.sponsors, "company_name"),
    contractName: row.contract_name,
    contractValue: value,
    valueDisplay: formatCurrency(value),
    status: row.contract_status,
    startDate: row.start_date,
    endDate: row.end_date,
    startDateDisplay: formatContractDate(row.start_date),
    endDateDisplay: formatContractDate(row.end_date),
    deliverables: row.deliverables ?? "",
    notes: row.notes ?? "",
    sourceOpportunityId: row.source_opportunity_id ?? null,
    sourceApplicationId: row.source_application_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function isContractOverdue(
  contract: Contract,
  now = new Date()
): boolean {
  if (contract.status !== "active" || !contract.endDate) return false;
  const end = new Date(contract.endDate + "T00:00:00");
  return end.getTime() < now.getTime();
}

export function isExpiringSoon(
  contract: Contract,
  withinDays = 45,
  now = new Date()
): boolean {
  if (contract.status !== "active" || !contract.endDate) return false;
  if (isContractOverdue(contract, now)) return false;
  const end = new Date(contract.endDate + "T00:00:00");
  const diff = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= withinDays;
}

export function getContractStats(contracts: Contract[]) {
  const active = contracts.filter((c) => c.status === "active");
  const negotiating = contracts.filter(
    (c) => c.status === "negotiating" || c.status === "draft"
  );
  const expiringSoon = contracts.filter((c) => isExpiringSoon(c));
  const overdue = contracts.filter((c) => isContractOverdue(c));
  const pipeline = contracts.filter(
    (c) =>
      c.status === "active" ||
      c.status === "negotiating" ||
      c.status === "draft"
  );
  const totalValue = pipeline.reduce((sum, c) => sum + c.contractValue, 0);

  return {
    activeCount: active.length,
    negotiatingCount: negotiating.length,
    expiringSoonCount: expiringSoon.length,
    overdueCount: overdue.length,
    totalValue,
    totalValueDisplay: formatCurrency(totalValue),
  };
}

function monthsBetween(start: Date, end: Date): number {
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth()) +
    1;
  return Math.max(1, months);
}

export function getContractMonthlyValue(contract: Contract, now = new Date()): number {
  if (contract.status !== "active" || contract.contractValue <= 0) return 0;

  if (contract.startDate && contract.endDate) {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const start = new Date(contract.startDate + "T00:00:00");
    const end = new Date(contract.endDate + "T00:00:00");

    if (end < monthStart || start > monthEnd) return 0;

    return contract.contractValue / monthsBetween(start, end);
  }

  // Active contract without dates: estimate as value spread over 12 months.
  return contract.contractValue / 12;
}

export function getMonthlyRevenue(contracts: Contract[], now = new Date()): number {
  return contracts.reduce(
    (sum, contract) => sum + getContractMonthlyValue(contract, now),
    0
  );
}

export function getMonthlyRevenueSummary(
  contracts: Contract[],
  now = new Date()
): { amount: number; activeContractCount: number } {
  const activeContracts = contracts.filter(
    (c) => c.status === "active" && c.contractValue > 0
  );

  return {
    amount: getMonthlyRevenue(contracts, now),
    activeContractCount: activeContracts.length,
  };
}

export function getUpcomingExpirations(
  contracts: Contract[],
  withinDays = 45,
  now = new Date()
): Contract[] {
  return contracts
    .filter((c) => isExpiringSoon(c, withinDays, now))
    .sort((a, b) => {
      if (!a.endDate || !b.endDate) return 0;
      return a.endDate.localeCompare(b.endDate);
    });
}

export function getOverdueContracts(
  contracts: Contract[],
  now = new Date()
): Contract[] {
  return contracts
    .filter((c) => isContractOverdue(c, now))
    .sort((a, b) => {
      if (!a.endDate || !b.endDate) return 0;
      return a.endDate.localeCompare(b.endDate);
    });
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
