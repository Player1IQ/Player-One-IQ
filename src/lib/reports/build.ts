import {
  formatCurrency,
  getContractMonthlyValue,
  getContractStats,
  type Contract,
} from "@/lib/contracts";
import type { SponsorCampaign } from "@/lib/campaigns";
import type { ContractDeliverable } from "@/lib/contract-deliverables";
import type { Creator } from "@/lib/creators";
import {
  summarizeCreatorIncome,
  type CreatorRevenueEntry,
} from "@/lib/creator-revenue";
import { getDashboardRevenueSummary } from "@/lib/revenue/summary";
import { getOpportunityStats, type Opportunity } from "@/lib/opportunities";
import type { AiUsageSummary, UsageSnapshot } from "@/lib/subscription/types";
import {
  buildCampaignReportSummary,
  buildDeliverableHealthReport,
  buildRevenuePeriodComparison,
  buildSponsorBreakdown,
  type CampaignReportSummary,
  type DeliverableHealthReport,
  type RevenuePeriodComparison,
  type SponsorBreakdownRow,
} from "@/lib/reports/aggregates";

export interface CreatorRevenueRow {
  id: string;
  name: string;
  contractRevenue: number;
  platformRevenue: number;
  total: number;
  totalDisplay: string;
}

export interface MonthlyReportData {
  periodLabel: string;
  creatorCount: number;
  connectedAccountCount: number;
  revenue: ReturnType<typeof getDashboardRevenueSummary>;
  revenueComparison: RevenuePeriodComparison | null;
  contractStats: ReturnType<typeof getContractStats>;
  opportunityStats: ReturnType<typeof getOpportunityStats>;
  campaignSummary: CampaignReportSummary;
  deliverableHealth: DeliverableHealthReport;
  sponsorBreakdown: SponsorBreakdownRow[];
  creatorLeaderboard: CreatorRevenueRow[];
  platformBreakdown: Array<{
    platform: string;
    total: number;
    totalDisplay: string;
  }>;
  aiUsage: AiUsageSummary[];
  usage: UsageSnapshot[];
}

export type {
  CampaignReportSummary,
  DeliverableHealthReport,
  RevenuePeriodComparison,
  SponsorBreakdownRow,
};

export function buildCreatorRevenueLeaderboard(
  creators: Creator[],
  contracts: Contract[],
  revenueEntries: CreatorRevenueEntry[],
  now = new Date()
): CreatorRevenueRow[] {
  return creators
    .map((creator) => {
      const contractRevenue = contracts
        .filter((contract) => contract.creatorId === creator.id)
        .reduce(
          (sum, contract) => sum + getContractMonthlyValue(contract, now),
          0
        );

      const platformRevenue = summarizeCreatorIncome(
        revenueEntries.filter((entry) => entry.creatorId === creator.id)
      ).total;

      const total = contractRevenue + platformRevenue;

      return {
        id: creator.id,
        name: creator.name,
        contractRevenue,
        platformRevenue,
        total,
        totalDisplay: formatCurrency(total),
      };
    })
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total);
}

export function buildPlatformBreakdown(
  revenueEntries: CreatorRevenueEntry[]
): MonthlyReportData["platformBreakdown"] {
  const totals = new Map<string, number>();

  for (const entry of revenueEntries) {
    totals.set(entry.platform, (totals.get(entry.platform) ?? 0) + entry.amount);
  }

  return Array.from(totals.entries())
    .map(([platform, total]) => ({
      platform,
      total,
      totalDisplay: formatCurrency(total),
    }))
    .sort((a, b) => b.total - a.total);
}

export function buildMonthlyReportData(params: {
  creators: Creator[];
  contracts: Contract[];
  opportunities: Opportunity[];
  campaigns: SponsorCampaign[];
  deliverables: ContractDeliverable[];
  revenueEntries: CreatorRevenueEntry[];
  previousMonthRevenueEntries?: CreatorRevenueEntry[];
  previousPeriodMonth?: string;
  connectedAccountCount: number;
  aiUsage: AiUsageSummary[];
  usage: UsageSnapshot[];
  periodMonth: string;
}): MonthlyReportData {
  const monthDate = new Date(`${params.periodMonth}T00:00:00Z`);
  const periodLabel = monthDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const revenue = getDashboardRevenueSummary(
    params.contracts,
    params.revenueEntries,
    params.connectedAccountCount
  );

  const revenueComparison =
    params.previousPeriodMonth && params.previousMonthRevenueEntries
      ? buildRevenuePeriodComparison({
          contracts: params.contracts,
          currentMonthEntries: params.revenueEntries,
          previousMonthEntries: params.previousMonthRevenueEntries,
          currentPeriodMonth: params.periodMonth,
          previousPeriodMonth: params.previousPeriodMonth,
          currentTotal: revenue.total,
        })
      : null;

  return {
    periodLabel,
    creatorCount: params.creators.length,
    connectedAccountCount: params.connectedAccountCount,
    revenue,
    revenueComparison,
    contractStats: getContractStats(params.contracts),
    opportunityStats: getOpportunityStats(params.opportunities),
    campaignSummary: buildCampaignReportSummary(params.campaigns),
    deliverableHealth: buildDeliverableHealthReport(params.deliverables),
    sponsorBreakdown: buildSponsorBreakdown(params.contracts),
    creatorLeaderboard: buildCreatorRevenueLeaderboard(
      params.creators,
      params.contracts,
      params.revenueEntries
    ),
    platformBreakdown: buildPlatformBreakdown(params.revenueEntries),
    aiUsage: params.aiUsage,
    usage: params.usage,
  };
}
