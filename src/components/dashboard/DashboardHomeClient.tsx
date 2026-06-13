"use client";

import Link from "next/link";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  Building2,
  FileText,
  DollarSign,
  AlertTriangle,
  Briefcase,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Target,
  LineChart,
  Brain,
  ArrowRight,
} from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Creator } from "@/lib/creators";
import type { Contract } from "@/lib/contracts";
import type { DashboardRevenueSummary } from "@/lib/revenue/summary";
import { StatusBadge } from "@/components/creators/StatusBadge";

interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  summary: string;
  detail?: string | null;
  timeAgo: string;
}

interface RevenueTrendPoint {
  month: string;
  contract: number;
  platform: number;
}

interface CreatorGrowthPoint {
  month: string;
  creators: number;
}

interface DashboardHomeClientProps {
  creators: Creator[];
  activeCreators: Creator[];
  contractStats: {
    activeCount: number;
    totalValueDisplay: string;
    expiringSoonCount: number;
  };
  monthlyRevenue: DashboardRevenueSummary;
  activeSponsorsCount: number;
  totalSponsors: number;
  opportunityStats: { openCount: number; applicationCount: number };
  unreadMessages: number;
  conversationCount: number;
  activity: ActivityItem[];
  upcomingExpirations: Contract[];
  overdueContracts: Contract[];
  revenueTrend: RevenueTrendPoint[];
  creatorGrowth: CreatorGrowthPoint[];
}

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

const chartTooltipStyle = {
  backgroundColor: "#111520",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
  fontSize: "12px",
};

const aiAssistants = [
  {
    title: "Growth Coach",
    description: "Analyze performance and recommend growth strategies",
    icon: TrendingUp,
    href: "/ai",
    color: "from-violet-500/20 to-purple-600/10",
  },
  {
    title: "Sponsorship Hunter",
    description: "Match creators with high-fit sponsor opportunities",
    icon: Target,
    href: "/ai",
    color: "from-fuchsia-500/20 to-pink-600/10",
  },
  {
    title: "Content Strategist",
    description: "Optimize content mix across platforms",
    icon: Brain,
    href: "/ai",
    color: "from-indigo-500/20 to-blue-600/10",
  },
  {
    title: "Revenue Optimizer",
    description: "Forecast earnings and contract pipeline value",
    icon: LineChart,
    href: "/ai",
    color: "from-emerald-500/20 to-teal-600/10",
  },
];

export function DashboardHomeClient({
  creators,
  activeCreators,
  contractStats,
  monthlyRevenue,
  activeSponsorsCount,
  totalSponsors,
  opportunityStats,
  unreadMessages,
  conversationCount,
  activity,
  upcomingExpirations,
  overdueContracts,
  revenueTrend,
  creatorGrowth,
}: DashboardHomeClientProps) {
  const hasRevenueTrend = revenueTrend.some(
    (point) => point.contract > 0 || point.platform > 0
  );
  const hasCreatorGrowth = creatorGrowth.some((point) => point.creators > 0);

  const topCreators = [...creators]
    .sort((a, b) => (a.name > b.name ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Monthly Revenue"
          value={monthlyRevenue.totalDisplay}
          subtitle={monthlyRevenue.subtitle}
          href="/creators"
          icon={DollarSign}
          iconColor="text-accent-light"
        />
        <MetricCard
          title="Sponsorship Value"
          value={contractStats.totalValueDisplay}
          subtitle={`${contractStats.activeCount} active contracts`}
          href="/contracts"
          icon={FileText}
          iconColor="text-fuchsia-400"
        />
        <MetricCard
          title="Active Opportunities"
          value={String(opportunityStats.openCount)}
          subtitle={`${opportunityStats.applicationCount} applications`}
          href="/opportunities"
          icon={Briefcase}
          iconColor="text-blue-400"
        />
        <MetricCard
          title="Creator Growth"
          value={String(activeCreators.length)}
          subtitle={`${creators.length} on roster`}
          href="/creators"
          icon={Users}
          iconColor="text-violet-400"
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Sponsors"
          value={String(activeSponsorsCount)}
          subtitle={`${totalSponsors} in pipeline`}
          href="/sponsors"
          icon={Building2}
          iconColor="text-purple-400"
        />
        <MetricCard
          title="Expiring Soon"
          value={String(contractStats.expiringSoonCount)}
          subtitle="Contracts ending in 45 days"
          href="/contracts?filter=expiring"
          icon={AlertTriangle}
          iconColor="text-orange-400"
          highlight={contractStats.expiringSoonCount > 0}
        />
        <MetricCard
          title="Unread Messages"
          value={String(unreadMessages)}
          subtitle={`${conversationCount} conversations`}
          href="/messages"
          icon={MessageSquare}
          iconColor="text-emerald-400"
        />
        <MetricCard
          title="Platform Revenue"
          value={monthlyRevenue.platformRevenueDisplay}
          subtitle={`${monthlyRevenue.connectedAccountCount} connected accounts`}
          href="/creators"
          icon={TrendingUp}
          iconColor="text-cyan-400"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>
              Contract & platform revenue — last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasRevenueTrend ? (
              <div className="h-64 min-h-[16rem] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrend}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Area
                      type="monotone"
                      dataKey="contract"
                      stroke="#7C3AED"
                      fill="url(#revenueGrad)"
                      strokeWidth={2}
                      name="Contracts"
                    />
                    <Area
                      type="monotone"
                      dataKey="platform"
                      stroke="#A78BFA"
                      fill="transparent"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      name="Platform"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                icon={LineChart}
                title="No revenue trend yet"
                description="Add contracts or connect platforms to see trends"
                className="min-h-[16rem]"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Creator Growth</CardTitle>
            <CardDescription>
              Cumulative creators on roster — last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasCreatorGrowth ? (
              <div className="h-64 min-h-[16rem] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={creatorGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar
                      dataKey="creators"
                      fill="#7C3AED"
                      radius={[6, 6, 0, 0]}
                      name="Creators"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title="No creators yet"
                description="Add creators to your roster to see growth over time"
                className="min-h-[16rem]"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent-light" />
            <h2 className="text-lg font-semibold text-white">AI Recommendations</h2>
          </div>
          <Link
            href="/ai"
            className="flex items-center gap-1 text-xs font-medium text-accent-light hover:text-white"
          >
            Open AI workspace <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {aiAssistants.map((assistant) => {
            const Icon = assistant.icon;
            return (
              <Link key={assistant.title} href={assistant.href}>
                <div
                  className={`group rounded-2xl border border-white/[0.06] bg-gradient-to-br ${assistant.color} p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-card-hover`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 ring-1 ring-accent/25">
                    <Icon className="h-5 w-5 text-accent-light" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-white">
                    {assistant.title}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    {assistant.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Leaderboard + Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Creators</CardTitle>
                <CardDescription>Your roster leaderboard</CardDescription>
              </div>
              <Link href="/creators" className="text-xs font-medium text-accent-light hover:text-white">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {topCreators.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No creators yet"
                description="Add your first creator to get started"
              />
            ) : (
              <ul className="space-y-3">
                {topCreators.map((creator, index) => (
                  <li
                    key={creator.id}
                    className="flex items-center gap-4 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 transition-colors hover:border-accent/20"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent-light">
                      {index + 1}
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent/30 to-accent-muted/30 text-xs font-bold text-white">
                      {creator.avatarInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/creators/${creator.id}`}
                        className="text-sm font-medium text-gray-200 hover:text-accent-light"
                      >
                        {creator.name}
                      </Link>
                      <p className="text-xs text-gray-500">{creator.primaryPlatform}</p>
                    </div>
                    <StatusBadge status={creator.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates across your workspace</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {activity.length === 0 ? (
              <EmptyState
                title="No activity yet"
                description="Create a contract or opportunity to get started"
              />
            ) : (
              <ul className="space-y-3">
                {activity.slice(0, 8).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-3 border-b border-white/[0.04] pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-200">
                        {activityLabel(item.action, item.entityType, item.summary)}
                      </p>
                      {item.detail && (
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {item.detail}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-gray-600">
                      {item.timeAgo}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expirations & Overdue */}
      {(upcomingExpirations.length > 0 || overdueContracts.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {upcomingExpirations.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Upcoming Expirations</CardTitle>
                    <CardDescription>Contracts ending within 45 days</CardDescription>
                  </div>
                  <Badge variant="warning">{upcomingExpirations.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-3">
                  {upcomingExpirations.slice(0, 4).map((contract) => (
                    <li key={contract.id} className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-orange-400" />
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
                      <span className="text-xs font-medium text-orange-400">
                        {contract.endDateDisplay}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {overdueContracts.length > 0 && (
            <Card className="border-red-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Overdue Contracts</CardTitle>
                    <CardDescription>Past end date, still active</CardDescription>
                  </div>
                  <Badge variant="danger">{overdueContracts.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-3">
                  {overdueContracts.slice(0, 4).map((contract) => (
                    <li key={contract.id} className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/contracts/${contract.id}`}
                          className="text-sm font-medium text-gray-200 hover:text-accent-light"
                        >
                          {contract.contractName}
                        </Link>
                        <p className="text-xs text-gray-500">
                          Ended {contract.endDateDisplay}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
