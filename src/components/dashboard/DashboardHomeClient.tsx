"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
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
  TrendingUp,
  Target,
  LineChart,
  Brain,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CommandCenterHeader } from "@/components/dashboard/CommandCenterHeader";
import { MonthSelector } from "@/components/revenue/MonthSelector";
import { OpsQueue, type OpsQueueItem } from "@/components/dashboard/OpsQueue";
import { CommandHeroMetric } from "@/components/dashboard/CommandHeroMetric";
import { TelemetryPanel } from "@/components/dashboard/TelemetryPanel";
import { SectorHeader } from "@/components/dashboard/SectorHeader";
import type { Creator } from "@/lib/creators";
import type { Contract } from "@/lib/contracts";
import type { DashboardRevenueSummary } from "@/lib/revenue/summary";
import { formatCurrency } from "@/lib/contracts";
import { StatusBadge } from "@/components/creators/StatusBadge";
import { CreatorAvatar } from "@/components/creators/CreatorAvatar";
import { PresenceBadge } from "@/components/presence/PresenceBadge";
import { TodayScheduleCard } from "@/components/schedule/TodayScheduleCard";
import type { ScheduleEvent } from "@/lib/schedule";
import type { CoachContext, CreatorCoachSnapshot } from "@/lib/creator-coach/types";
import { CreatorCoachPanel } from "@/components/creator-coach";

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
  organizationName: string;
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
  pendingApplications?: number;
  revenueTrend: RevenueTrendPoint[];
  creatorGrowth: CreatorGrowthPoint[];
  todaySchedule?: ScheduleEvent[];
  coachSnapshot?: CreatorCoachSnapshot | null;
  coachContext?: CoachContext | null;
  periodMonth?: string;
}

function activityLabel(
  action: string,
  entityType: string,
  summary: string,
  t: ReturnType<typeof useTranslations<"dashboard">>
): string {
  if (entityType === "opportunity" || entityType === "message") {
    return summary;
  }
  const contractLabels: Record<string, string> = {
    created: t("activity.contractCreated"),
    updated: t("activity.contractUpdated"),
    status_changed: t("activity.statusChanged"),
    deleted: t("activity.contractDeleted"),
  };
  return contractLabels[action] ?? summary;
}

const chartTooltipStyle = {
  backgroundColor: "#111520",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
  fontSize: "12px",
};

function buildOpsQueueItems({
  overdueContracts,
  contractStats,
  pendingApplications,
  unreadMessages,
  t,
}: {
  overdueContracts: Contract[];
  contractStats: { expiringSoonCount: number };
  pendingApplications: number;
  unreadMessages: number;
  t: ReturnType<typeof useTranslations<"dashboard">>;
}): OpsQueueItem[] {
  const items: OpsQueueItem[] = [];

  for (const contract of overdueContracts) {
    items.push({
      id: `overdue-${contract.id}`,
      label: contract.contractName,
      detail: t("opsQueue.pastEndDate", {
        sponsor: contract.sponsorName,
        creator: contract.creatorName,
      }),
      href: `/contracts/${contract.id}`,
      severity: "critical",
    });
  }

  if (contractStats.expiringSoonCount > 0) {
    items.push({
      id: "expiring",
      label: t("opsQueue.expiringSoon", { count: contractStats.expiringSoonCount }),
      detail: t("opsQueue.expiringSoonDetail"),
      href: "/contracts?filter=expiring",
      severity: "warning",
    });
  }

  if (pendingApplications > 0) {
    items.push({
      id: "applications",
      label: t("opsQueue.applicationsAwaiting", { count: pendingApplications }),
      detail: t("opsQueue.applicationsDetail"),
      href: "/opportunities/applications",
      severity: "info",
    });
  }

  if (unreadMessages > 0) {
    items.push({
      id: "messages",
      label: t("opsQueue.unreadMessages", { count: unreadMessages }),
      detail: t("opsQueue.unreadMessagesDetail"),
      href: "/messages",
      severity: "comms",
    });
  }

  return items;
}

export function DashboardHomeClient({
  organizationName,
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
  pendingApplications = 0,
  revenueTrend,
  creatorGrowth,
  todaySchedule = [],
  coachSnapshot = null,
  coachContext = null,
  periodMonth,
}: DashboardHomeClientProps) {
  const t = useTranslations("dashboard");

  const aiAssistants = [
    {
      title: t("aiAssistants.growthCoach"),
      description: t("aiAssistants.growthCoachDescription"),
      icon: TrendingUp,
      href: "/ai",
      color: "from-violet-500/20 to-purple-600/10",
    },
    {
      title: t("aiAssistants.sponsorshipHunter"),
      description: t("aiAssistants.sponsorshipHunterDescription"),
      icon: Target,
      href: "/ai",
      color: "from-fuchsia-500/20 to-pink-600/10",
    },
    {
      title: t("aiAssistants.contentStrategist"),
      description: t("aiAssistants.contentStrategistDescription"),
      icon: Brain,
      href: "/ai",
      color: "from-indigo-500/20 to-blue-600/10",
    },
    {
      title: t("aiAssistants.revenueOptimizer"),
      description: t("aiAssistants.revenueOptimizerDescription"),
      icon: LineChart,
      href: "/ai",
      color: "from-emerald-500/20 to-teal-600/10",
    },
  ];

  const hasRevenueTrend = revenueTrend.some(
    (point) => point.contract > 0 || point.platform > 0
  );
  const hasCreatorGrowth = creatorGrowth.some((point) => point.creators > 0);

  const opsQueueItems = buildOpsQueueItems({
    overdueContracts,
    contractStats,
    pendingApplications,
    unreadMessages,
    t,
  });

  const topCreators = [...creators]
    .sort((a, b) => (a.name > b.name ? 1 : -1))
    .slice(0, 5);

  const telemetryMetrics = [
    {
      title: t("metrics.activeSponsors"),
      value: String(activeSponsorsCount),
      subtitle: t("metrics.inPipeline", { count: totalSponsors }),
      href: "/sponsors",
      icon: Building2,
      iconColor: "text-purple-400",
    },
    {
      title: t("metrics.expiringSoon"),
      value: String(contractStats.expiringSoonCount),
      subtitle: t("metrics.contractsEnding45Days"),
      href: "/contracts?filter=expiring",
      icon: AlertTriangle,
      iconColor: "text-orange-400",
      highlight: contractStats.expiringSoonCount > 0,
    },
    {
      title: t("metrics.unreadMessages"),
      value: String(unreadMessages),
      subtitle: t("metrics.conversations", { count: conversationCount }),
      href: "/messages",
      icon: MessageSquare,
      iconColor: "text-emerald-400",
    },
    {
      title: t("metrics.platformRevenue"),
      value: formatCurrency(monthlyRevenue.platformRevenue),
      subtitle: t("metrics.connectedAccounts", {
        count: monthlyRevenue.connectedAccountCount,
      }),
      href: "/creators",
      icon: TrendingUp,
      iconColor: "text-cyan-400",
    },
  ];

  return (
    <div className="command-center-bg space-y-8 animate-fade-in pb-2" data-tour-spot="dashboard-home">
      {coachSnapshot && coachContext ? (
        <CreatorCoachPanel
          snapshot={coachSnapshot}
          coachContext={coachContext}
        />
      ) : null}

      <CommandCenterHeader
        organizationName={organizationName}
        attentionCount={opsQueueItems.length}
      />

      {periodMonth ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <MonthSelector periodMonth={periodMonth} />
        </div>
      ) : null}

      <OpsQueue items={opsQueueItems} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CommandHeroMetric
          telemetry={t("metrics.monthlyRevenue")}
          value={formatCurrency(monthlyRevenue.total)}
          subtitle={monthlyRevenue.subtitle}
          href="/creators"
          icon={DollarSign}
          iconColor="text-accent-light"
        />
        <CommandHeroMetric
          telemetry={t("metrics.cashReceived")}
          value={formatCurrency(monthlyRevenue.cashReceived)}
          subtitle={t("metrics.expectedFromDeals", {
            amount: formatCurrency(monthlyRevenue.expectedDeals),
          })}
          href="/contracts"
          icon={FileText}
          iconColor="text-emerald-400"
        />
        <CommandHeroMetric
          telemetry={t("metrics.openOpportunities")}
          value={String(opportunityStats.openCount)}
          subtitle={t("metrics.applications", {
            count: opportunityStats.applicationCount,
          })}
          href="/opportunities"
          icon={Briefcase}
          iconColor="text-blue-400"
          pulse={pendingApplications > 0}
        />
        <CommandHeroMetric
          telemetry={t("metrics.activeCreators")}
          value={String(activeCreators.length)}
          subtitle={t("metrics.onRoster", { count: creators.length })}
          href="/creators"
          icon={Users}
          iconColor="text-violet-400"
        />
      </div>

      <TelemetryPanel metrics={telemetryMetrics} />

      <section className="space-y-4">
        <SectorHeader
          sector={t("sections.revenue")}
          title={t("sections.performanceOverview")}
          description={t("sections.performanceDescription")}
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("sections.revenueOverview")}</CardTitle>
              <CardDescription>{t("sections.revenueOverviewDescription")}</CardDescription>
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
                        name={t("charts.contracts")}
                      />
                      <Area
                        type="monotone"
                        dataKey="platform"
                        stroke="#A78BFA"
                        fill="transparent"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        name={t("charts.platform")}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  icon={LineChart}
                  title={t("charts.noRevenueTrend")}
                  description={t("charts.noRevenueTrendDescription")}
                  className="min-h-[16rem]"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("sections.creatorGrowth")}</CardTitle>
              <CardDescription>{t("sections.creatorGrowthDescription")}</CardDescription>
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
                        name={t("charts.creators")}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  icon={Users}
                  title={t("charts.noCreatorsYet")}
                  description={t("charts.noCreatorsDescription")}
                  className="min-h-[16rem]"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <SectorHeader
          sector={t("sections.ai")}
          title={t("sections.aiWorkspace")}
          description={t("sections.aiWorkspaceDescription")}
          action={
            <Link
              href="/ai"
              className="flex items-center gap-1 text-xs font-medium text-accent-light hover:text-white"
            >
              {t("sections.openAiWorkspace")} <ArrowRight className="h-3 w-3" />
            </Link>
          }
        />
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

      <section className="space-y-4">
        <SectorHeader
          sector={t("sections.team")}
          title={t("sections.creatorsAndActivity")}
          description={t("sections.creatorsAndActivityDescription")}
        />
        <div className="grid gap-6 lg:grid-cols-3">
          <TodayScheduleCard events={todaySchedule} />
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("widgets.topCreators")}</CardTitle>
                  <CardDescription>{t("widgets.topCreatorsDescription")}</CardDescription>
                </div>
                <Link href="/creators" className="text-xs font-medium text-accent-light hover:text-white">
                  {t("widgets.viewAll")}
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {topCreators.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title={t("widgets.noCreatorsYet")}
                  description={t("widgets.noCreatorsDescription")}
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
                      <CreatorAvatar
                        imageUrl={creator.avatarUrl}
                        initials={creator.avatarInitials}
                        color={creator.avatarColor}
                        name={creator.name}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/creators/${creator.id}`}
                          className="text-sm font-medium text-gray-200 hover:text-accent-light"
                        >
                          {creator.name}
                        </Link>
                        <p className="text-xs text-gray-500">{creator.primaryPlatform}</p>
                        <div className="mt-0.5">
                          <PresenceBadge status={creator.availabilityStatus} showLabel={false} />
                        </div>
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
              <CardTitle>{t("widgets.recentActivity")}</CardTitle>
              <CardDescription>{t("widgets.recentActivityDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {activity.length === 0 ? (
                <EmptyState
                  title={t("widgets.noActivityYet")}
                  description={t("widgets.noActivityDescription")}
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
                          {activityLabel(item.action, item.entityType, item.summary, t)}
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
      </section>

      {(upcomingExpirations.length > 0 || overdueContracts.length > 0) && (
        <section className="space-y-4">
          <SectorHeader
            sector={t("sections.contracts")}
            title={t("sections.renewalsOverdue")}
            description={t("sections.renewalsOverdueDescription")}
          />
          <div className="grid gap-6 lg:grid-cols-2">
            {upcomingExpirations.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{t("widgets.upcomingExpirations")}</CardTitle>
                      <CardDescription>{t("widgets.upcomingExpirationsDescription")}</CardDescription>
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
                      <CardTitle>{t("widgets.overdueContracts")}</CardTitle>
                      <CardDescription>{t("widgets.overdueContractsDescription")}</CardDescription>
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
                            {t("widgets.endedOn", { date: contract.endDateDisplay })}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
