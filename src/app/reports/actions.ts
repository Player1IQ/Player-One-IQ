"use server";

import { getContracts } from "@/lib/contracts/queries";
import { getCurrentPeriodMonth } from "@/lib/creator-revenue";
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

  const [
    creators,
    contracts,
    opportunities,
    revenueEntries,
    connectedAccountCount,
    subscription,
    aiUsage,
    organization,
  ] = await Promise.all([
    getCreators(),
    getContracts(),
    getOpportunities(),
    getOrganizationRevenueEntries(periodMonth),
    getConnectedPlatformAccountCount(),
    getSubscriptionContext(),
    getAiUsageSummary(),
    getOrganizationForUser(),
  ]);

  const report = buildMonthlyReportData({
    creators,
    contracts,
    opportunities,
    revenueEntries,
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
