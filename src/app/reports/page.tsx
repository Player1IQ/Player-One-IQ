import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ReportsPageClient } from "@/components/reports/ReportsPageClient";
import { SubscriptionPageGate } from "@/components/subscription/SubscriptionPageGate";
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
import { canViewReports, getCurrentUserRole } from "@/lib/permissions";
import { getOpportunities } from "@/lib/opportunities/queries";
import { buildMonthlyReportData } from "@/lib/reports/build";
import {
  getAiUsageSummary,
  getSubscriptionContext,
} from "@/lib/subscription/queries";

export default async function ReportsPage() {
  const role = await getCurrentUserRole();
  if (!canViewReports(role)) {
    redirect("/");
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
    subscription,
    aiUsage,
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

  return (
    <DashboardLayout
      title="Reports"
      description="Monthly performance and revenue analytics"
    >
      <SubscriptionPageGate
        required={["advanced_analytics", "monthly_reports"]}
        featureLabel="Monthly reports & advanced analytics"
      >
        <ReportsPageClient report={report} />
      </SubscriptionPageGate>
    </DashboardLayout>
  );
}
