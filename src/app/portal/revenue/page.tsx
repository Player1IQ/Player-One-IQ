import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PortalRevenueClient } from "@/components/portal/PortalRevenueClient";
import { getCreatorById } from "@/lib/creators/queries";
import { getContracts } from "@/lib/contracts/queries";
import {
  getCreatorPlatformAccounts,
  getCreatorRevenueEntries,
  getCreatorRevenueEntriesForMonths,
} from "@/lib/creator-revenue/queries";
import {
  getCreatorPaidContractPaymentsForMonth,
  getPaidContractPaymentsForMonths,
} from "@/lib/payments/queries";
import { requireCreatorPortalUser } from "@/lib/portal/guard";
import { getOAuthPlatformUi } from "@/lib/platform-oauth/config";
import { getLastNMonthKeys, groupRevenueEntriesByMonth } from "@/lib/dashboard/charts";
import {
  buildCreatorMonthlyRevenue,
  buildMonthlyRevenueTrend,
  getPeriodMonthFromSearchParams,
} from "@/lib/revenue/monthly";

export default async function PortalRevenuePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { linkedCreatorId } = await requireCreatorPortalUser();
  const resolvedSearchParams = await searchParams;
  const periodMonth = getPeriodMonthFromSearchParams(resolvedSearchParams);
  const monthKeys = getLastNMonthKeys(12).map((month) => month.key);

  const [
    creator,
    contracts,
    platformAccounts,
    revenueEntries,
    trendEntries,
    payments,
    trendPayments,
  ] = await Promise.all([
    getCreatorById(linkedCreatorId),
    getContracts(),
    getCreatorPlatformAccounts(linkedCreatorId),
    getCreatorRevenueEntries(linkedCreatorId, periodMonth),
    getCreatorRevenueEntriesForMonths(linkedCreatorId, monthKeys),
    getCreatorPaidContractPaymentsForMonth(linkedCreatorId, periodMonth),
    getPaidContractPaymentsForMonths(monthKeys),
  ]);

  if (!creator) {
    redirect("/portal");
  }

  const creatorContracts = contracts.filter((c) => c.creatorId === linkedCreatorId);
  const entriesByMonth = groupRevenueEntriesByMonth(trendEntries);
  const summary = buildCreatorMonthlyRevenue({
    periodMonth,
    contracts: creatorContracts,
    platformEntries: revenueEntries,
    payments,
  });
  const trend = buildMonthlyRevenueTrend(
    getLastNMonthKeys(12),
    creatorContracts,
    entriesByMonth,
    trendPayments
  );

  return (
    <DashboardLayout
      title="Revenue"
      description="Track cash received, platform income, and expected deal value"
    >
      <PortalRevenueClient
        creator={creator}
        contracts={creatorContracts}
        platformAccounts={platformAccounts}
        revenueEntries={revenueEntries}
        payments={payments}
        summary={summary}
        trend={trend}
        periodMonth={periodMonth}
        oauthPlatformUi={getOAuthPlatformUi()}
      />
    </DashboardLayout>
  );
}
