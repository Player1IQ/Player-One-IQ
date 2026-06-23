import {
  formatCurrency,
  getContractMonthlyValue,
  type Contract,
} from "@/lib/contracts";
import {
  campaignStatuses,
  campaignStatusLabels,
  formatCampaignBudget,
  getCampaignStats,
  type CampaignStatus,
  type SponsorCampaign,
} from "@/lib/campaigns";
import {
  getDeliverableStats,
  type ContractDeliverable,
} from "@/lib/contract-deliverables";
import type { CreatorRevenueEntry } from "@/lib/creator-revenue";

const PIPELINE_STATUSES = new Set<Contract["status"]>([
  "active",
  "negotiating",
  "draft",
]);

export interface CampaignReportSummary {
  totalCount: number;
  activeCount: number;
  draftCount: number;
  completedCount: number;
  pausedCount: number;
  totalBudget: number;
  totalBudgetDisplay: string;
  byStatus: Array<{ status: CampaignStatus; label: string; count: number }>;
  topByBudget: Array<{
    id: string;
    name: string;
    sponsorName: string;
    budget: number;
    budgetDisplay: string;
    status: CampaignStatus;
  }>;
}

export interface DeliverableHealthReport {
  pendingCount: number;
  inProgressCount: number;
  completedCount: number;
  overdueCount: number;
  totalCount: number;
  completionRatePercent: number;
}

export interface SponsorBreakdownRow {
  sponsorId: string;
  sponsorName: string;
  pipelineValue: number;
  pipelineValueDisplay: string;
  activeContractCount: number;
  totalContractCount: number;
}

export interface RevenuePeriodComparison {
  previousTotal: number;
  previousTotalDisplay: string;
  delta: number;
  deltaDisplay: string;
  deltaPercent: number | null;
  direction: "up" | "down" | "flat";
}

function monthTotalRevenue(
  contracts: Contract[],
  platformEntries: CreatorRevenueEntry[],
  periodMonth: string
): number {
  const monthDate = new Date(`${periodMonth}T00:00:00`);
  const contractRevenue = contracts.reduce(
    (sum, contract) => sum + getContractMonthlyValue(contract, monthDate),
    0
  );
  const platformRevenue = platformEntries.reduce(
    (sum, entry) => sum + entry.amount,
    0
  );
  return contractRevenue + platformRevenue;
}

export function buildCampaignReportSummary(
  campaigns: SponsorCampaign[]
): CampaignReportSummary {
  const stats = getCampaignStats(campaigns);

  const byStatus = campaignStatuses
    .map((status) => ({
      status,
      label: campaignStatusLabels[status],
      count: campaigns.filter((campaign) => campaign.status === status).length,
    }))
    .filter((row) => row.count > 0);

  const topByBudget = [...campaigns]
    .filter((campaign) => (campaign.budget ?? 0) > 0)
    .sort((a, b) => (b.budget ?? 0) - (a.budget ?? 0))
    .slice(0, 5)
    .map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      sponsorName: campaign.sponsorName,
      budget: campaign.budget ?? 0,
      budgetDisplay: campaign.budgetDisplay,
      status: campaign.status,
    }));

  return {
    ...stats,
    pausedCount: campaigns.filter((campaign) => campaign.status === "paused")
      .length,
    byStatus,
    topByBudget,
    totalBudgetDisplay: formatCampaignBudget(stats.totalBudget || null),
  };
}

export function buildDeliverableHealthReport(
  deliverables: ContractDeliverable[]
): DeliverableHealthReport {
  const stats = getDeliverableStats(deliverables);

  return {
    pendingCount: stats.pendingCount,
    inProgressCount: stats.inProgressCount,
    completedCount: stats.completedCount,
    overdueCount: stats.overdueCount,
    totalCount: stats.total,
    completionRatePercent: stats.progressPercent,
  };
}

export function buildSponsorBreakdown(
  contracts: Contract[]
): SponsorBreakdownRow[] {
  const bySponsor = new Map<
    string,
    {
      sponsorName: string;
      pipelineValue: number;
      activeContractCount: number;
      totalContractCount: number;
    }
  >();

  for (const contract of contracts) {
    const existing = bySponsor.get(contract.sponsorId) ?? {
      sponsorName: contract.sponsorName,
      pipelineValue: 0,
      activeContractCount: 0,
      totalContractCount: 0,
    };

    existing.totalContractCount += 1;
    if (contract.status === "active") {
      existing.activeContractCount += 1;
    }
    if (PIPELINE_STATUSES.has(contract.status)) {
      existing.pipelineValue += contract.contractValue;
    }

    bySponsor.set(contract.sponsorId, existing);
  }

  return Array.from(bySponsor.entries())
    .map(([sponsorId, row]) => ({
      sponsorId,
      sponsorName: row.sponsorName,
      pipelineValue: row.pipelineValue,
      pipelineValueDisplay: formatCurrency(row.pipelineValue),
      activeContractCount: row.activeContractCount,
      totalContractCount: row.totalContractCount,
    }))
    .sort((a, b) => b.pipelineValue - a.pipelineValue)
    .slice(0, 5);
}

export function buildRevenuePeriodComparison(params: {
  contracts: Contract[];
  currentMonthEntries: CreatorRevenueEntry[];
  previousMonthEntries: CreatorRevenueEntry[];
  currentPeriodMonth: string;
  previousPeriodMonth: string;
  currentTotal: number;
}): RevenuePeriodComparison | null {
  const previousTotal = monthTotalRevenue(
    params.contracts,
    params.previousMonthEntries,
    params.previousPeriodMonth
  );

  if (previousTotal === 0 && params.currentTotal === 0) {
    return null;
  }

  const delta = params.currentTotal - previousTotal;
  const deltaPercent =
    previousTotal > 0 ? Math.round((delta / previousTotal) * 100) : null;

  let direction: RevenuePeriodComparison["direction"] = "flat";
  if (delta > 0) direction = "up";
  else if (delta < 0) direction = "down";

  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  const deltaDisplay =
    delta === 0
      ? "No change"
      : `${sign}${formatCurrency(Math.abs(delta))}${
          deltaPercent !== null ? ` (${sign}${Math.abs(deltaPercent)}%)` : ""
        }`;

  return {
    previousTotal,
    previousTotalDisplay: formatCurrency(previousTotal),
    delta,
    deltaDisplay,
    deltaPercent,
    direction,
  };
}
