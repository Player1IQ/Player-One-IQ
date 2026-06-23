"use server";

import { getCampaigns } from "@/lib/campaigns/queries";
import { getContracts } from "@/lib/contracts/queries";
import { getOrganizationDeliverables } from "@/lib/contract-deliverables/queries";
import {
  getCurrentPeriodMonth,
  getPreviousPeriodMonth,
} from "@/lib/creator-revenue";
import {
  getConnectedPlatformAccountCount,
  getOrganizationRevenueEntries,
} from "@/lib/creator-revenue/queries";
import { getCreators } from "@/lib/creators/queries";
import { getOrganizationForUser } from "@/lib/organization/queries";
import { getOpportunities } from "@/lib/opportunities/queries";
import { requireFeatureAccess } from "@/lib/permissions";
import { buildMonthlyReportData } from "@/lib/reports/build";
import {
  getAiUsageSummary,
  getSubscriptionContext,
} from "@/lib/subscription/queries";

export async function fetchMonthlyReportExport() {
  const permError = await requireFeatureAccess(
    ["advanced_analytics", "monthly_reports"],
    "Report export"
  );
  if (permError) return permError;

  const periodMonth = getCurrentPeriodMonth();
  const previousPeriodMonth = getPreviousPeriodMonth();

  const [
    creators,
    contracts,
    opportunities,
    campaigns,
    deliverables,
    revenueEntries,
    previousMonthRevenueEntries,
    connectedAccountCount,
    subscription,
    aiUsage,
    organization,
  ] = await Promise.all([
    getCreators(),
    getContracts(),
    getOpportunities(),
    getCampaigns(),
    getOrganizationDeliverables(),
    getOrganizationRevenueEntries(periodMonth),
    getOrganizationRevenueEntries(previousPeriodMonth),
    getConnectedPlatformAccountCount(),
    getSubscriptionContext(),
    getAiUsageSummary(),
    getOrganizationForUser(),
  ]);

  const report = buildMonthlyReportData({
    creators,
    contracts,
    opportunities,
    campaigns,
    deliverables,
    revenueEntries,
    previousMonthRevenueEntries,
    previousPeriodMonth,
    connectedAccountCount,
    aiUsage,
    usage: subscription.usage,
    periodMonth,
  });

  return {
    success: true as const,
    report,
    organizationName: organization?.name ?? "Your organization",
  };
}
