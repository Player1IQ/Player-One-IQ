import { formatCurrency, type Contract } from "@/lib/contracts";
import {
  summarizeOrganizationPlatformRevenue,
  type CreatorRevenueEntry,
} from "@/lib/creator-revenue";
import { getMonthlyRevenueSummary } from "@/lib/contracts";

export interface DashboardRevenueSummary {
  total: number;
  totalDisplay: string;
  contractRevenue: number;
  contractRevenueDisplay: string;
  platformRevenue: number;
  platformRevenueDisplay: string;
  advertisementRevenue: number;
  advertisementRevenueDisplay: string;
  activeContractCount: number;
  connectedAccountCount: number;
  subtitle: string;
}

export function getDashboardRevenueSummary(
  contracts: Contract[],
  platformEntries: CreatorRevenueEntry[],
  connectedAccountCount: number
): DashboardRevenueSummary {
  const contractSummary = getMonthlyRevenueSummary(contracts);
  const platformSummary = summarizeOrganizationPlatformRevenue(
    platformEntries,
    connectedAccountCount
  );

  const total = contractSummary.amount + platformSummary.platformRevenue;

  let subtitle = "";
  if (contractSummary.activeContractCount > 0 && connectedAccountCount > 0) {
    subtitle = `${formatCurrency(contractSummary.amount)} contracts · ${platformSummary.platformRevenueDisplay} platform income`;
  } else if (contractSummary.activeContractCount > 0) {
    subtitle = `${formatCurrency(contractSummary.amount)} from active contracts`;
  } else if (connectedAccountCount > 0) {
    subtitle = `${platformSummary.platformRevenueDisplay} from connected platform accounts`;
  } else {
    subtitle = "Connect creator platforms or activate contracts to track revenue";
  }

  return {
    total,
    totalDisplay: formatCurrency(total),
    contractRevenue: contractSummary.amount,
    contractRevenueDisplay: formatCurrency(contractSummary.amount),
    platformRevenue: platformSummary.platformRevenue,
    platformRevenueDisplay: platformSummary.platformRevenueDisplay,
    advertisementRevenue: platformSummary.advertisementRevenue,
    advertisementRevenueDisplay: formatCurrency(
      platformSummary.advertisementRevenue
    ),
    activeContractCount: contractSummary.activeContractCount,
    connectedAccountCount,
    subtitle,
  };
}
