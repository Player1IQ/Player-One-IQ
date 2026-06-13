import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardHomeClient } from "@/components/dashboard/DashboardHomeClient";
import { getCreators } from "@/lib/creators/queries";
import { getSponsors } from "@/lib/sponsors/queries";
import { getContracts } from "@/lib/contracts/queries";
import { getRecentActivity } from "@/lib/activity/queries";
import { getOpportunities } from "@/lib/opportunities/queries";
import { getOpportunityStats } from "@/lib/opportunities";
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
import { getCurrentPeriodMonth } from "@/lib/creator-revenue";
import { getDashboardRevenueSummary } from "@/lib/revenue/summary";
import {
  buildCreatorGrowthData,
  buildRevenueTrendData,
  getLastNMonthKeys,
  groupRevenueEntriesByMonth,
} from "@/lib/dashboard/charts";

export default async function DashboardPage() {
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
  ]);

  const opportunityStats = getOpportunityStats(opportunities);
  const activeCreators = creators.filter((c) => c.status === "active");
  const activeSponsors = sponsors.filter((s) => s.status === "active");
  const contractStats = getContractStats(contracts);
  const currentMonth = getCurrentPeriodMonth();
  const currentMonthEntries = platformRevenueEntries.filter(
    (entry) => entry.periodMonth === currentMonth
  );
  const monthlyRevenue = getDashboardRevenueSummary(
    contracts,
    currentMonthEntries,
    connectedAccountCount
  );
  const entriesByMonth = groupRevenueEntriesByMonth(platformRevenueEntries);
  const revenueTrend = buildRevenueTrendData(contracts, entriesByMonth).map(
    ({ month, contract, platform }) => ({ month, contract, platform })
  );
  const creatorGrowth = buildCreatorGrowthData(creators);
  const upcomingExpirations = getUpcomingExpirations(contracts);
  const overdueContracts = getOverdueContracts(contracts);

  return (
    <DashboardLayout
      title="Command Center"
      description="Executive overview of your creator ecosystem"
    >
      <DashboardHomeClient
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
        revenueTrend={revenueTrend}
        creatorGrowth={creatorGrowth}
      />
    </DashboardLayout>
  );
}
