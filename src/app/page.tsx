import Link from "next/link";
import {
  Users,
  Building2,
  FileText,
  DollarSign,
  AlertTriangle,
  Briefcase,
  MessageSquare,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
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
  formatCurrency,
  getContractStats,
  getOverdueContracts,
  getUpcomingExpirations,
} from "@/lib/contracts";
import {
  getConnectedPlatformAccountCount,
  getOrganizationRevenueEntries,
} from "@/lib/creator-revenue/queries";
import { getDashboardRevenueSummary } from "@/lib/revenue/summary";
import { StatusBadge } from "@/components/creators/StatusBadge";

function activityLabel(
  action: string,
  entityType: string,
  summary: string
): string {
  if (entityType === "opportunity" || entityType === "message") {
    return summary;
  }
  const contractLabels: Record<string, string> = {
    created: "Contract created",
    updated: "Contract updated",
    status_changed: "Status changed",
    deleted: "Contract deleted",
  };
  return contractLabels[action] ?? summary;
}

export default async function DashboardPage() {
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
    getOrganizationRevenueEntries(),
    getConnectedPlatformAccountCount(),
  ]);

  const opportunityStats = getOpportunityStats(opportunities);
  const opportunityActivity = activity.filter(
    (item) => item.entityType === "opportunity"
  );
  const messageActivity = activity.filter(
    (item) => item.entityType === "message"
  );

  const activeCreators = creators.filter((c) => c.status === "active");
  const activeSponsors = sponsors.filter((s) => s.status === "active");
  const contractStats = getContractStats(contracts);
  const monthlyRevenue = getDashboardRevenueSummary(
    contracts,
    platformRevenueEntries,
    connectedAccountCount
  );
  const upcomingExpirations = getUpcomingExpirations(contracts);
  const overdueContracts = getOverdueContracts(contracts);

  const stats = [
    {
      title: "Active Creators",
      value: String(activeCreators.length),
      subtitle: `${creators.length} on roster`,
      href: "/creators",
      icon: Users,
      iconColor: "bg-violet-500/10 text-violet-400 ring-violet-500/20",
    },
    {
      title: "Active Sponsors",
      value: String(activeSponsors.length),
      subtitle: `${sponsors.length} in pipeline`,
      href: "/sponsors",
      icon: Building2,
      iconColor: "bg-purple-500/10 text-purple-400 ring-purple-500/20",
    },
    {
      title: "Active Contracts",
      value: String(contractStats.activeCount),
      subtitle: `${contracts.length} total · ${contractStats.totalValueDisplay} pipeline`,
      href: "/contracts",
      icon: FileText,
      iconColor: "bg-fuchsia-500/10 text-fuchsia-400 ring-fuchsia-500/20",
    },
    {
      title: "Monthly Revenue",
      value: monthlyRevenue.totalDisplay,
      subtitle: monthlyRevenue.subtitle,
      href: "/creators",
      icon: DollarSign,
      iconColor: "bg-accent/10 text-accent-light ring-accent/20",
    },
    {
      title: "Expiring Soon",
      value: String(contractStats.expiringSoonCount),
      subtitle: "Active contracts ending in 45 days",
      href: "/contracts?filter=expiring",
      icon: AlertTriangle,
      iconColor: "bg-orange-500/10 text-orange-400 ring-orange-500/20",
      highlight: contractStats.expiringSoonCount > 0,
    },
    {
      title: "Open Opportunities",
      value: String(opportunityStats.openCount),
      subtitle: `${opportunityStats.applicationCount} applications`,
      href: "/opportunities",
      icon: Briefcase,
      iconColor: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
    },
    {
      title: "Unread Messages",
      value: String(unreadMessages),
      subtitle: `${conversations.length} conversations`,
      href: "/messages",
      icon: MessageSquare,
      iconColor: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    },
  ];

  return (
    <DashboardLayout
      title="Dashboard"
      description="Overview of your creator and sponsor ecosystem"
    >
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface-raised p-6">
          <h2 className="text-base font-semibold text-white">
            Recent Activity
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Latest updates across contracts and opportunities
          </p>
          {activity.length === 0 ? (
            <p className="mt-6 text-sm text-gray-500">
              No activity yet. Create a contract or opportunity to get started.
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {activity.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between border-b border-border-subtle pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-200">
                      {activityLabel(item.action, item.entityType, item.summary)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.detail ?? item.summary}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-600">
                    {item.timeAgo}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface-raised p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                Opportunity Activity
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Recent marketplace updates
              </p>
            </div>
            <Link
              href="/opportunities"
              className="text-xs font-medium text-accent-light hover:text-white"
            >
              View all
            </Link>
          </div>
          {opportunityActivity.length === 0 ? (
            <p className="mt-6 text-sm text-gray-500">
              No opportunity activity yet.{" "}
              <Link
                href="/opportunities"
                className="text-accent-light hover:underline"
              >
                Create an opportunity
              </Link>
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {opportunityActivity.slice(0, 5).map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between border-b border-border-subtle pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-200">
                      {item.summary}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.detail ?? "—"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-600">
                    {item.timeAgo}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-8 rounded-xl border border-border bg-surface-raised p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Messages</h2>
            <p className="mt-1 text-sm text-gray-500">
              Recent conversations and message activity
            </p>
          </div>
          <Link
            href="/messages"
            className="text-xs font-medium text-accent-light hover:text-white"
          >
            Open inbox
          </Link>
        </div>
        {conversations.length === 0 ? (
          <p className="mt-6 text-sm text-gray-500">
            No conversations yet.{" "}
            <Link href="/messages" className="text-accent-light hover:underline">
              Start messaging
            </Link>
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {conversations.slice(0, 5).map((conversation) => (
              <li
                key={conversation.id}
                className="flex items-center justify-between border-b border-border-subtle pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <Link
                    href={`/messages/${conversation.id}`}
                    className="text-sm font-medium text-gray-200 hover:text-accent-light"
                  >
                    {conversation.title}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {conversation.lastMessage ?? "No messages yet"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {conversation.updatedAtDisplay}
                  </p>
                  {conversation.unreadCount > 0 && (
                    <p className="text-xs font-medium text-accent-light">
                      {conversation.unreadCount} unread
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {messageActivity.length > 0 && (
          <div className="mt-6 border-t border-border-subtle pt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Recent message activity
            </p>
            <ul className="mt-4 space-y-3">
              {messageActivity.slice(0, 3).map((item) => (
                <li key={item.id} className="text-sm text-gray-400">
                  <span className="text-gray-200">{item.summary}</span>
                  {item.detail ? ` — ${item.detail}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-xl border border-border bg-surface-raised p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                Upcoming Expirations
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Active contracts ending within 45 days
              </p>
            </div>
            <Link
              href="/contracts?filter=expiring"
              className="text-xs font-medium text-accent-light hover:text-white"
            >
              View all
            </Link>
          </div>
          {upcomingExpirations.length === 0 ? (
            <p className="mt-6 text-sm text-gray-500">
              No contracts expiring soon.
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {upcomingExpirations.slice(0, 5).map((contract) => (
                <li
                  key={contract.id}
                  className="flex items-center gap-4 border-b border-border-subtle pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10">
                    <AlertTriangle className="h-4 w-4 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/contracts/${contract.id}`}
                      className="text-sm font-medium text-gray-200 hover:text-accent-light"
                    >
                      {contract.contractName}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {contract.sponsorName} × {contract.creatorName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-orange-400">
                      {contract.endDateDisplay}
                    </p>
                    <p className="text-xs text-gray-500">
                      {contract.valueDisplay}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
      </section>

      {overdueContracts.length > 0 && (
        <section className="mt-8 rounded-xl border border-red-500/20 bg-red-500/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                Overdue Contracts
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Past end date but still marked active
              </p>
            </div>
            <Link
              href="/contracts?filter=overdue"
              className="text-xs font-medium text-accent-light hover:text-white"
            >
              View all
            </Link>
          </div>
          <ul className="mt-6 space-y-4">
            {overdueContracts.slice(0, 5).map((contract) => (
              <li
                key={contract.id}
                className="flex items-center gap-4 border-b border-red-500/10 pb-4 last:border-0 last:pb-0"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/contracts/${contract.id}`}
                    className="text-sm font-medium text-gray-200 hover:text-accent-light"
                  >
                    {contract.contractName}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {contract.sponsorName} × {contract.creatorName}
                  </p>
                </div>
                <p className="shrink-0 text-xs font-medium text-red-400">
                  Ended {contract.endDateDisplay}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8 rounded-xl border border-border bg-surface-raised p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Your Creators</h2>
            <p className="mt-1 text-sm text-gray-500">
              Recently added to your roster
            </p>
          </div>
          <Link
            href="/creators"
            className="text-xs font-medium text-accent-light hover:text-white"
          >
            View all
          </Link>
        </div>
        {creators.length === 0 ? (
          <p className="mt-6 text-sm text-gray-500">
            No creators yet.{" "}
            <Link href="/creators" className="text-accent-light hover:underline">
              Add your first creator
            </Link>
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {creators.slice(0, 5).map((creator) => (
              <li
                key={creator.id}
                className="flex items-center gap-4 border-b border-border-subtle pb-4 last:border-0 last:pb-0"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent-light">
                  {creator.avatarInitials}
                </div>
                <div className="flex-1">
                  <Link
                    href={`/creators/${creator.id}`}
                    className="text-sm font-medium text-gray-200 hover:text-accent-light"
                  >
                    {creator.name}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {creator.primaryPlatform}
                  </p>
                </div>
                <StatusBadge status={creator.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </DashboardLayout>
  );
}
