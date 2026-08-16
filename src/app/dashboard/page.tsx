import { getOrganizationForUser } from "@/lib/organization/queries";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardHomeClient } from "@/components/dashboard/DashboardHomeClient";
import { getCreators } from "@/lib/creators/queries";
import { getCurrentUserRole } from "@/lib/permissions";
import { canAccessStaffDashboard } from "@/lib/team";
import { getSponsors } from "@/lib/sponsors/queries";
import { getContracts } from "@/lib/contracts/queries";
import { getRecentActivity } from "@/lib/activity/queries";
import { getOpportunities } from "@/lib/opportunities/queries";
import { getAllApplications } from "@/lib/opportunities/queries";
import { getOpportunityStats, getApplicationStats } from "@/lib/opportunities";
import {
  getConversations,
  getUnreadMessageCount,
} from "@/lib/messages/queries";
import {
  getContractStats,
  getOverdueContracts,
  getUpcomingExpirations,
} from "@/lib/contracts";
import {
  getConnectedPlatformAccountCount,
  getOrganizationRevenueEntriesForMonths,
} from "@/lib/creator-revenue/queries";
import { getDashboardRevenueSummary } from "@/lib/revenue/summary";
import { getPaidContractPaymentsForMonth } from "@/lib/payments/queries";
import { getPeriodMonthFromSearchParams } from "@/lib/revenue/monthly";
import {
  buildCreatorGrowthData,
  buildRevenueTrendData,
  getLastNMonthKeys,
  groupRevenueEntriesByMonth,
} from "@/lib/dashboard/charts";
import { getTodayScheduleEvents } from "@/lib/schedule/queries";
import {
  buildOrganizationCoachContext,
  buildCreatorCoachSnapshot,
  getCurrentUserDisplayName,
  getCurrentUserId,
} from "@/lib/creator-coach";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const role = await getCurrentUserRole();
  if (role && !canAccessStaffDashboard(role)) {
    redirect("/portal");
  }

  const resolvedSearchParams = await searchParams;
  const periodMonth = getPeriodMonthFromSearchParams(resolvedSearchParams);
  const monthKeys = getLastNMonthKeys(6).map((month) => month.key);

  const [
    creators,
    sponsors,
    contracts,
    opportunities,
    conversations,
    unreadMessages,
    activity,
    platformRevenueEntries,
    connectedAccountCount,
    applications,
    todaySchedule,
    userId,
    userDisplayName,
    paidPayments,
  ] = await Promise.all([
    getCreators(),
    getSponsors(),
    getContracts(),
    getOpportunities(),
    getConversations(),
    getUnreadMessageCount(),
    getRecentActivity(10),
    getOrganizationRevenueEntriesForMonths(monthKeys),
    getConnectedPlatformAccountCount(),
    getAllApplications(),
    getTodayScheduleEvents(),
    getCurrentUserId(),
    getCurrentUserDisplayName(),
    getPaidContractPaymentsForMonth(periodMonth),
  ]);

  const opportunityStats = getOpportunityStats(opportunities);
  const pendingApplications = getApplicationStats(applications).needsAction;
  const activeCreators = creators.filter((c) => c.status === "active");
  const activeSponsors = sponsors.filter((s) => s.status === "active");
  const contractStats = getContractStats(contracts);
  const currentMonthEntries = platformRevenueEntries.filter(
    (entry) => entry.periodMonth === periodMonth
  );
  const monthlyRevenue = getDashboardRevenueSummary(
    contracts,
    currentMonthEntries,
    connectedAccountCount,
    { periodMonth, payments: paidPayments }
  );
  const entriesByMonth = groupRevenueEntriesByMonth(platformRevenueEntries);
  const revenueTrend = buildRevenueTrendData(contracts, entriesByMonth).map(
    ({ month, contract, platform }) => ({ month, contract, platform })
  );
  const creatorGrowth = buildCreatorGrowthData(creators);
  const upcomingExpirations = getUpcomingExpirations(contracts);
  const overdueContracts = getOverdueContracts(contracts);
  const organization = await getOrganizationForUser();

  const coachContext = buildOrganizationCoachContext({
    userDisplayName,
    creators,
    contracts,
    connectedAccountCount,
    monthlyRevenue,
    openOpportunityCount: opportunityStats.openCount,
    pendingApplications,
    todaySchedule,
    unreadMessages,
    expiringContractsCount: contractStats.expiringSoonCount,
  });

  const coachSnapshot = userId
    ? await buildCreatorCoachSnapshot({
        userId,
        creatorCoachContext: coachContext,
      })
    : null;

  const t = await getTranslations("pages.dashboard");

  return (
    <DashboardLayout
      title={t("title")}
      description={t("description")}
    >
      <DashboardHomeClient
        organizationName={organization?.name ?? "Your workspace"}
        creators={creators}
        activeCreators={activeCreators}
        contractStats={contractStats}
        monthlyRevenue={monthlyRevenue}
        activeSponsorsCount={activeSponsors.length}
        totalSponsors={sponsors.length}
        opportunityStats={opportunityStats}
        unreadMessages={unreadMessages}
        conversationCount={conversations.length}
        activity={activity}
        upcomingExpirations={upcomingExpirations}
        overdueContracts={overdueContracts}
        pendingApplications={pendingApplications}
        revenueTrend={revenueTrend}
        creatorGrowth={creatorGrowth}
        todaySchedule={todaySchedule}
        coachSnapshot={coachSnapshot}
        coachContext={coachContext}
        periodMonth={periodMonth}
      />
    </DashboardLayout>
  );
}
