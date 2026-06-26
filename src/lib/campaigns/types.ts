export type CampaignStatus = "draft" | "active" | "completed" | "paused";

export const campaignStatuses: CampaignStatus[] = [
  "draft",
  "active",
  "completed",
  "paused",
];

export const campaignStatusLabels: Record<CampaignStatus, string> = {
  draft: "Draft",
  active: "Active",
  completed: "Completed",
  paused: "Paused",
};

export interface SponsorCampaignRow {
  id: string;
  organization_id: string;
  sponsor_id: string;
  name: string;
  status: CampaignStatus;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  related_opportunity_id: string | null;
  created_at: string;
  updated_at: string;
  sponsors?: { company_name: string } | { company_name: string }[] | null;
  opportunities?: { title: string } | { title: string }[] | null;
}

export interface SponsorCampaign {
  id: string;
  organizationId: string;
  sponsorId: string;
  sponsorName: string;
  name: string;
  status: CampaignStatus;
  budget: number | null;
  budgetDisplay: string;
  startDate: string | null;
  endDate: string | null;
  startDateDisplay: string;
  endDateDisplay: string;
  notes: string;
  relatedOpportunityId: string | null;
  relatedOpportunityTitle: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignInput {
  name: string;
  sponsorId: string;
  status: CampaignStatus;
  budget: number | null;
  startDate: string | null;
  endDate: string | null;
  notes: string;
  relatedOpportunityId: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso + (iso.includes("T") ? "" : "T00:00:00")).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );
}

export function formatCampaignBudget(amount: number | null): string {
  if (amount === null || amount <= 0) return "—";
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function relatedName<T extends { company_name?: string; title?: string }>(
  value: T | T[] | null | undefined,
  key: "company_name" | "title"
): string | null {
  if (!value) return null;
  const row = Array.isArray(value) ? value[0] : value;
  if (!row) return null;
  return row[key] ?? null;
}

export function mapCampaignRow(row: SponsorCampaignRow): SponsorCampaign {
  const status = campaignStatuses.includes(row.status)
    ? row.status
    : "draft";

  return {
    id: row.id,
    organizationId: row.organization_id,
    sponsorId: row.sponsor_id,
    sponsorName:
      relatedName(row.sponsors, "company_name") ?? "Unknown sponsor",
    name: row.name,
    status,
    budget: row.budget,
    budgetDisplay: formatCampaignBudget(row.budget),
    startDate: row.start_date,
    endDate: row.end_date,
    startDateDisplay: formatDate(row.start_date),
    endDateDisplay: formatDate(row.end_date),
    notes: row.notes ?? "",
    relatedOpportunityId: row.related_opportunity_id,
    relatedOpportunityTitle: relatedName(row.opportunities, "title"),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getCampaignStats(campaigns: SponsorCampaign[]) {
  return {
    totalCount: campaigns.length,
    activeCount: campaigns.filter((c) => c.status === "active").length,
    draftCount: campaigns.filter((c) => c.status === "draft").length,
    completedCount: campaigns.filter((c) => c.status === "completed").length,
    totalBudget: campaigns.reduce((sum, c) => sum + (c.budget ?? 0), 0),
    totalBudgetDisplay: formatCampaignBudget(
      campaigns.reduce((sum, c) => sum + (c.budget ?? 0), 0) || null
    ),
  };
}
