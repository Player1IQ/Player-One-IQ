import { type Contract } from "@/lib/contracts";
import { formatCurrencyAmount } from "@/lib/currency";
import {
  getCurrentPeriodMonth,
  summarizeOrganizationPlatformRevenue,
  type CreatorRevenueEntry,
} from "@/lib/creator-revenue";
import { getMonthlyRevenueSummary } from "@/lib/contracts";
import {
  buildMonthlyRevenueBreakdown,
  buildMonthlyRevenueSubtitle,
  normalizePeriodMonth,
  sumCashReceivedDollars,
  type MonthlyRevenueBreakdown,
} from "@/lib/revenue/monthly";
import type { ContractPayment } from "@/lib/payments/types";

export interface DashboardRevenueSummary {
  total: number;
  totalDisplay: string;
  cashReceived: number;
  cashReceivedDisplay: string;
  expectedDeals: number;
  expectedDealsDisplay: string;
  /** @deprecated Use expectedDeals — kept for backward compatibility */
  contractRevenue: number;
  /** @deprecated Use expectedDealsDisplay */
  contractRevenueDisplay: string;
  platformRevenue: number;
  platformRevenueDisplay: string;
  advertisementRevenue: number;
  advertisementRevenueDisplay: string;
  activeContractCount: number;
  connectedAccountCount: number;
  periodMonth: string;
  subtitle: string;
}

export interface DashboardRevenueSummaryOptions {
  periodMonth?: string;
  payments?: ContractPayment[];
}

export function getDashboardRevenueSummary(
  contracts: Contract[],
  platformEntries: CreatorRevenueEntry[],
  connectedAccountCount: number,
  options: DashboardRevenueSummaryOptions = {}
): DashboardRevenueSummary {
  const periodMonth = normalizePeriodMonth(options.periodMonth);
  const payments = options.payments ?? [];
  const contractSummary = getMonthlyRevenueSummary(
    contracts,
    new Date(`${periodMonth}T00:00:00`)
  );
  const breakdown = buildMonthlyRevenueBreakdown({
    periodMonth,
    contracts,
    platformEntries,
    payments,
    connectedAccountCount,
  });
  const platformSummary = summarizeOrganizationPlatformRevenue(
    platformEntries,
    connectedAccountCount
  );

  return {
    total: breakdown.total,
    totalDisplay: breakdown.totalDisplay,
    cashReceived: breakdown.cashReceived,
    cashReceivedDisplay: breakdown.cashReceivedDisplay,
    expectedDeals: breakdown.expectedDeals,
    expectedDealsDisplay: breakdown.expectedDealsDisplay,
    contractRevenue: breakdown.expectedDeals,
    contractRevenueDisplay: breakdown.expectedDealsDisplay,
    platformRevenue: breakdown.platformRevenue,
    platformRevenueDisplay: breakdown.platformRevenueDisplay,
    advertisementRevenue: platformSummary.advertisementRevenue,
    advertisementRevenueDisplay: formatCurrencyAmount(
      platformSummary.advertisementRevenue
    ),
    activeContractCount: contractSummary.activeContractCount,
    connectedAccountCount,
    periodMonth,
    subtitle: buildMonthlyRevenueSubtitle(breakdown),
  };
}

export function getCreatorDashboardRevenueSummary(
  contracts: Contract[],
  platformEntries: CreatorRevenueEntry[],
  payments: ContractPayment[],
  periodMonth = getCurrentPeriodMonth()
): MonthlyRevenueBreakdown {
  return buildMonthlyRevenueBreakdown({
    periodMonth: normalizePeriodMonth(periodMonth),
    contracts,
    platformEntries,
    payments,
  });
}

export { sumCashReceivedDollars };
