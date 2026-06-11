import { DashboardLayout } from "@/components/DashboardLayout";
import { ReportsPageClient } from "@/components/reports/ReportsPageClient";
import { SubscriptionPageGate } from "@/components/subscription/SubscriptionPageGate";
import { getContracts } from "@/lib/contracts/queries";
import { getCurrentPeriodMonth } from "@/lib/creator-revenue";
import {
  getConnectedPlatformAccountCount,
  getOrganizationRevenueEntries,
} from "@/lib/creator-revenue/queries";
import { getCreators } from "@/lib/creators/queries";
import { getOpportunities } from "@/lib/opportunities/queries";
import { buildMonthlyReportData } from "@/lib/reports/build";
import {
  getAiUsageSummary,
  getSubscriptionContext,
} from "@/lib/subscription/queries";

export default async function ReportsPage() {
  const periodMonth = getCurrentPeriodMonth();

  const [
    creators,
    contracts,
    opportunities,
    revenueEntries,
    connectedAccountCount,
    subscription,
    aiUsage,
  ] = await Promise.all([
    getCreators(),
    getContracts(),
    getOpportunities(),
    getOrganizationRevenueEntries(periodMonth),
    getConnectedPlatformAccountCount(),
    getSubscriptionContext(),
    getAiUsageSummary(),
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
