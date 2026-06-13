import { platforms, type Platform } from "@/lib/creators";
import { industries, type Industry } from "@/lib/sponsors";

export type OpportunityStatus = "draft" | "open" | "closed" | "filled";

export type ApplicationStatus =
  | "applied"
  | "under_review"
  | "accepted"
  | "rejected";

export const opportunityStatuses: OpportunityStatus[] = [
  "draft",
  "open",
  "closed",
  "filled",
];

export const applicationStatuses: ApplicationStatus[] = [
  "applied",
  "under_review",
  "accepted",
  "rejected",
];

export const opportunityCategories: Industry[] = industries;

export const opportunityPlatforms: Platform[] = platforms;

export interface OpportunityRow {
  id: string;
  organization_id: string;
  sponsor_id: string | null;
  title: string;
  description: string | null;
  budget: number | null;
  category: string;
  platform: string;
  deliverables: string | null;
  application_deadline: string | null;
  status: OpportunityStatus;
  created_at: string;
  updated_at: string;
  sponsors?: { company_name: string } | { company_name: string }[] | null;
}

export interface ApplicationRow {
  id: string;
  opportunity_id: string;
  creator_id: string;
  cover_message: string | null;
  proposed_rate: number | null;
  status: ApplicationStatus;
  created_at: string;
  creators?: { name: string } | { name: string }[] | null;
  opportunities?: { title: string; status: OpportunityStatus } | { title: string; status: OpportunityStatus }[] | null;
}

export interface Opportunity {
  id: string;
  organizationId: string;
  sponsorId: string | null;
  sponsorName: string | null;
  title: string;
  description: string;
  budget: number | null;
  budgetDisplay: string;
  category: Industry;
  platform: Platform;
  deliverables: string;
  applicationDeadline: string | null;
  applicationDeadlineDisplay: string;
  status: OpportunityStatus;
  createdAt: string;
  updatedAt: string;
  applicationCount: number;
}

export interface OpportunityApplication {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  opportunityStatus: OpportunityStatus;
  creatorId: string;
  creatorName: string;
  coverMessage: string;
  proposedRate: number | null;
  proposedRateDisplay: string;
  status: ApplicationStatus;
  createdAt: string;
  createdAtDisplay: string;
  contractId: string | null;
}

export interface OpportunityInput {
  title: string;
  description: string;
  sponsorId: string;
  budget: number | null;
  category: Industry;
  platform: Platform;
  deliverables: string;
  applicationDeadline: string;
  status: OpportunityStatus;
}

export interface ApplicationInput {
  opportunityId: string;
  creatorId: string;
  coverMessage: string;
  proposedRate: number | null;
}

export function formatBudget(value: number | null): string {
  if (value === null || value === 0) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatOpportunityDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso + (iso.includes("T") ? "" : "T00:00:00")).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );
}

function relationField<T>(
  relation: T | T[] | null | undefined
): T | null {
  if (!relation) return null;
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

export function mapOpportunityRow(
  row: OpportunityRow,
  applicationCount = 0
): Opportunity {
  const category = opportunityCategories.includes(row.category as Industry)
    ? (row.category as Industry)
    : "Gaming";
  const platform = opportunityPlatforms.includes(row.platform as Platform)
    ? (row.platform as Platform)
    : "YouTube";

  const sponsor = relationField(row.sponsors);

  return {
    id: row.id,
    organizationId: row.organization_id,
    sponsorId: row.sponsor_id,
    sponsorName: sponsor?.company_name ?? null,
    title: row.title,
    description: row.description ?? "",
    budget: row.budget !== null ? Number(row.budget) : null,
    budgetDisplay: formatBudget(row.budget !== null ? Number(row.budget) : null),
    category,
    platform,
    deliverables: row.deliverables ?? "",
    applicationDeadline: row.application_deadline,
    applicationDeadlineDisplay: formatOpportunityDate(row.application_deadline),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    applicationCount,
  };
}

export function mapApplicationRow(
  row: ApplicationRow,
  contractId: string | null = null
): OpportunityApplication {
  const creator = relationField(row.creators);
  const opportunity = relationField(row.opportunities);
  const rate =
    row.proposed_rate !== null ? Number(row.proposed_rate) : null;

  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    opportunityTitle: opportunity?.title ?? "Unknown",
    opportunityStatus: opportunity?.status ?? "closed",
    creatorId: row.creator_id,
    creatorName: creator?.name ?? "Unknown",
    coverMessage: row.cover_message ?? "",
    proposedRate: rate,
    proposedRateDisplay: formatBudget(rate),
    status: row.status,
    createdAt: row.created_at,
    createdAtDisplay: formatOpportunityDate(row.created_at),
    contractId,
  };
}

export function getApplicationStats(applications: OpportunityApplication[]) {
  return {
    total: applications.length,
    applied: applications.filter((a) => a.status === "applied").length,
    underReview: applications.filter((a) => a.status === "under_review").length,
    accepted: applications.filter((a) => a.status === "accepted").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    needsAction: applications.filter(
      (a) => a.status === "applied" || a.status === "under_review"
    ).length,
  };
}

export function getOpportunityStats(opportunities: Opportunity[]) {
  return {
    openCount: opportunities.filter((o) => o.status === "open").length,
    totalCount: opportunities.length,
    applicationCount: opportunities.reduce(
      (sum, o) => sum + o.applicationCount,
      0
    ),
  };
}

export const opportunityStatusLabels: Record<OpportunityStatus, string> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
  filled: "Filled",
};

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  applied: "Applied",
  under_review: "Under Review",
  accepted: "Accepted",
  rejected: "Rejected",
};
