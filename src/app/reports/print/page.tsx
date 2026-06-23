import { notFound, redirect } from "next/navigation";
import { ReportPrintClient } from "@/components/reports/ReportPrintClient";
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
import {
  buildPrintableReportBody,
  reportPrintStyles,
} from "@/lib/reports/print-html";
import { buildMonthlyReportData } from "@/lib/reports/build";
import { hasAnyFeature } from "@/lib/subscription/features";
import {
  getAiUsageSummary,
  getSubscriptionContext,
} from "@/lib/subscription/queries";

export default async function ReportPrintPage() {
  const subscription = await getSubscriptionContext();
  const canExport = hasAnyFeature(subscription.features, [
    "advanced_analytics",
    "monthly_reports",
  ]);

  if (!canExport) {
    redirect("/billing");
  }

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
    getAiUsageSummary(),
    getOrganizationForUser(),
  ]);

  if (!organization) {
    notFound();
  }

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

  const bodyHtml = buildPrintableReportBody(report, organization.name);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: reportPrintStyles }} />
      <div className="print-hint border-b border-gray-200 bg-gray-50 px-6 py-3 text-sm text-gray-600">
        <ReportPrintClient />
      </div>
      <div
        className="report-print-root"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
    </>
  );
}
