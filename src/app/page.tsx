import Link from "next/link";
import {
  Users,
  Building2,
  FileText,
  DollarSign,
  AlertTriangle,
  Briefcase,
  ClipboardList,
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
  formatCurrency,
  getMonthlyRevenue,
  getUpcomingExpirations,
} from "@/lib/contracts";
import { StatusBadge } from "@/components/creators/StatusBadge";

function activityLabel(
  action: string,
  entityType: string,
  summary: string
): string {
  if (entityType === "opportunity") {
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
  const [creators, sponsors, contracts, opportunities, activity] =
    await Promise.all([
      getCreators(),
      getSponsors(),
      getContracts(),
      getOpportunities(),
      getRecentActivity(10),
    ]);

  const opportunityStats = getOpportunityStats(opportunities);
  const opportunityActivity = activity.filter(
    (item) => item.entityType === "opportunity"
  );

  const activeCreators = creators.filter((c) => c.status === "active");
  const activeSponsors = sponsors.filter((s) => s.status === "active");
  const activeContracts = contracts.filter((c) => c.status === "active");
  const monthlyRevenue = getMonthlyRevenue(contracts);
  const upcomingExpirations = getUpcomingExpirations(contracts);

  const stats = [
    {
      title: "Active Creators",
      value: String(activeCreators.length),
      change: `${creators.length} total`,
      trend: "up" as const,
      icon: Users,
      iconColor: "bg-violet-500/10 text-violet-400 ring-violet-500/20",
    },
    {
      title: "Active Sponsors",
      value: String(activeSponsors.length),
      change: `${sponsors.length} total`,
      trend: "up" as const,
      icon: Building2,
      iconColor: "bg-purple-500/10 text-purple-400 ring-purple-500/20",
    },
    {
      title: "Active Contracts",
      value: String(activeContracts.length),
      change: `${contracts.length} total`,
      trend: "up" as const,
      icon: FileText,
      iconColor: "bg-fuchsia-500/10 text-fuchsia-400 ring-fuchsia-500/20",
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(monthlyRevenue),
      change: "From active contracts",
      trend: "up" as const,
      icon: DollarSign,
      iconColor: "bg-accent/10 text-accent-light ring-accent/20",
    },
    {
      title: "Open Opportunities",
      value: String(opportunityStats.openCount),
      change: `${opportunityStats.totalCount} total`,
      trend: "up" as const,
      icon: Briefcase,
      iconColor: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
    },
    {
      title: "Applications",
      value: String(opportunityStats.applicationCount),
      change: "Across all opportunities",
      trend: "up" as const,
      icon: ClipboardList,
      iconColor: "bg-cyan-500/10 text-cyan-400 ring-cyan-500/20",
    },
  ];

  return (
    <DashboardLayout
      title="Dashboard"
      description="Overview of your creator and sponsor ecosystem"
    >
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
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
              <h2 className="text-base font-semibold text-white">
                Upcoming Expirations
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Active contracts ending within 45 days
              </p>
            </div>
            <Link
              href="/contracts"
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
