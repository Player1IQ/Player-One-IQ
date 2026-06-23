"use client";

import Link from "next/link";
import {
  Briefcase,
  Building2,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  FileText,
  Link2,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import type { MonthlyReportData } from "@/lib/reports/build";
import { ExportReportMenu } from "@/components/reports/ExportReportMenu";
import { CampaignStatusBadge } from "@/components/campaigns/CampaignStatusBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface ReportsPageClientProps {
  report: MonthlyReportData;
}

function ReportEmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon: typeof Users;
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-white/[0.08] bg-surface/60 px-6 py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04]">
        <Icon className="h-5 w-5 text-gray-500" />
      </div>
      <p className="mt-3 text-sm font-medium text-white">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>
      <Link
        href={actionHref}
        className="mt-4 text-sm font-medium text-accent-light hover:text-white"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

export function ReportsPageClient({ report }: ReportsPageClientProps) {
  const aiRequestUsage = report.usage.find(
    (entry) => entry.metricKey === "ai_requests"
  );

  const hasRevenueData =
    report.creatorLeaderboard.length > 0 || report.platformBreakdown.length > 0;
  const showSparseBanner =
    !hasRevenueData &&
    report.revenue.total <= 0 &&
    report.contractStats.activeCount === 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {showSparseBanner ? (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="px-5 py-4">
            <p className="text-sm text-amber-100">
              <span className="font-medium text-amber-200">Light data this month.</span>{" "}
              Add creators, connect platform accounts, or log contracts to fill out
              your report. You can still export what you have today.
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <Link href="/creators" className="text-accent-light hover:text-white">
                Add creators
              </Link>
              <Link href="/contracts" className="text-accent-light hover:text-white">
                Create a contract
              </Link>
              <Link href="/settings" className="text-accent-light hover:text-white">
                Sync platform revenue
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-white/[0.06] bg-surface-raised/80">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-sm text-gray-400">
              Monthly report for{" "}
              <span className="font-medium text-white">{report.periodLabel}</span>
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {report.creatorCount} creator{report.creatorCount === 1 ? "" : "s"}
              {report.connectedAccountCount > 0
                ? ` · ${report.connectedAccountCount} OAuth-connected platform${
                    report.connectedAccountCount === 1 ? "" : "s"
                  }`
                : ""}
              {report.revenueComparison ? (
                <span
                  className={
                    report.revenueComparison.direction === "up"
                      ? "text-emerald-400"
                      : report.revenueComparison.direction === "down"
                        ? "text-red-400"
                        : "text-gray-500"
                  }
                >
                  {" "}
                  · vs last month: {report.revenueComparison.deltaDisplay}
                </span>
              ) : null}
            </p>
          </div>
          <ExportReportMenu canExport variant="page" />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total revenue"
          value={report.revenue.totalDisplay}
          subtitle={report.revenue.subtitle}
          icon={DollarSign}
          iconColor="text-accent-light"
        />
        <MetricCard
          title="Contract pipeline"
          value={report.contractStats.totalValueDisplay}
          subtitle={`${report.contractStats.activeCount} active in pipeline`}
          icon={FileText}
          iconColor="text-fuchsia-400"
        />
        <MetricCard
          title="Opportunities"
          value={String(report.opportunityStats.openCount)}
          subtitle={`${report.opportunityStats.totalCount} total opportunities`}
          icon={Briefcase}
          iconColor="text-blue-400"
        />
        <MetricCard
          title="AI requests"
          value={String(aiRequestUsage?.count ?? 0)}
          subtitle={
            aiRequestUsage?.limit
              ? `${aiRequestUsage.limit - aiRequestUsage.count} remaining this month`
              : "Unlimited on your plan"
          }
          icon={Sparkles}
          iconColor="text-violet-400"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-white/[0.06] bg-surface-raised/80">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-accent-light" />
              <CardTitle className="text-base">Campaign summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {report.campaignSummary.totalCount === 0 ? (
              <ReportEmptyState
                icon={Target}
                title="No campaigns yet"
                description="Create sponsor campaigns to track budgets and status across your deals."
                actionHref="/campaigns"
                actionLabel="View campaigns"
              />
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/[0.06] bg-surface px-4 py-3">
                    <p className="text-xs text-gray-500">Active</p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {report.campaignSummary.activeCount}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-surface px-4 py-3">
                    <p className="text-xs text-gray-500">Total budget</p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {report.campaignSummary.totalBudgetDisplay}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-surface px-4 py-3">
                    <p className="text-xs text-gray-500">Total campaigns</p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {report.campaignSummary.totalCount}
                    </p>
                  </div>
                </div>
                {report.campaignSummary.byStatus.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {report.campaignSummary.byStatus.map((row) => (
                      <span
                        key={row.status}
                        className="rounded-full border border-white/[0.08] bg-surface px-3 py-1 text-xs text-gray-300"
                      >
                        {row.label}: {row.count}
                      </span>
                    ))}
                  </div>
                ) : null}
                {report.campaignSummary.topByBudget.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Top by budget
                    </p>
                    {report.campaignSummary.topByBudget.map((campaign) => (
                      <Link
                        key={campaign.id}
                        href={`/campaigns/${campaign.id}`}
                        className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-surface px-4 py-3 transition-colors hover:border-accent/20"
                      >
                        <div>
                          <p className="text-sm font-medium text-white">
                            {campaign.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {campaign.sponsorName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <CampaignStatusBadge status={campaign.status} />
                          <p className="text-sm font-semibold text-accent-light">
                            {campaign.budgetDisplay}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/[0.06] bg-surface-raised/80">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-accent-light" />
              <CardTitle className="text-base">Deliverable health</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {report.deliverableHealth.totalCount === 0 ? (
              <ReportEmptyState
                icon={ClipboardList}
                title="No deliverables tracked"
                description="Add deliverables to contracts to monitor completion and overdue items."
                actionHref="/contracts"
                actionLabel="View contracts"
              />
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <MetricCard
                    title="Completion rate"
                    value={`${report.deliverableHealth.completionRatePercent}%`}
                    subtitle={`${report.deliverableHealth.completedCount} of ${report.deliverableHealth.totalCount} done`}
                    icon={CheckCircle2}
                    iconColor="text-emerald-400"
                  />
                  <MetricCard
                    title="Overdue"
                    value={String(report.deliverableHealth.overdueCount)}
                    subtitle="Past due date, not completed"
                    icon={report.deliverableHealth.overdueCount > 0 ? TrendingDown : CheckCircle2}
                    iconColor={
                      report.deliverableHealth.overdueCount > 0
                        ? "text-red-400"
                        : "text-emerald-400"
                    }
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/[0.06] bg-surface px-3 py-3 text-center">
                    <p className="text-lg font-semibold text-white">
                      {report.deliverableHealth.pendingCount}
                    </p>
                    <p className="text-xs text-gray-500">Pending</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-surface px-3 py-3 text-center">
                    <p className="text-lg font-semibold text-white">
                      {report.deliverableHealth.inProgressCount}
                    </p>
                    <p className="text-xs text-gray-500">In progress</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-surface px-3 py-3 text-center">
                    <p className="text-lg font-semibold text-white">
                      {report.deliverableHealth.completedCount}
                    </p>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/[0.06] bg-surface-raised/80">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-accent-light" />
            <CardTitle className="text-base">Top sponsors by pipeline</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {report.sponsorBreakdown.length === 0 ? (
            <ReportEmptyState
              icon={Building2}
              title="No sponsor pipeline yet"
              description="Active and negotiating contracts will appear here grouped by sponsor."
              actionHref="/sponsors"
              actionLabel="View sponsors"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="pb-2 pr-4 font-medium">Sponsor</th>
                    <th className="pb-2 pr-4 font-medium">Pipeline value</th>
                    <th className="pb-2 pr-4 font-medium">Active contracts</th>
                    <th className="pb-2 font-medium">Total contracts</th>
                  </tr>
                </thead>
                <tbody>
                  {report.sponsorBreakdown.map((row) => (
                    <tr
                      key={row.sponsorId}
                      className="border-b border-white/[0.04] last:border-0"
                    >
                      <td className="py-3 pr-4">
                        <Link
                          href={`/sponsors/${row.sponsorId}`}
                          className="font-medium text-white hover:text-accent-light"
                        >
                          {row.sponsorName}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 font-semibold text-accent-light">
                        {row.pipelineValueDisplay}
                      </td>
                      <td className="py-3 pr-4 text-gray-300">
                        {row.activeContractCount}
                      </td>
                      <td className="py-3 text-gray-300">
                        {row.totalContractCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-white/[0.06] bg-surface-raised/80">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent-light" />
              <CardTitle className="text-base">Top creators by revenue</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {report.creatorLeaderboard.length === 0 ? (
              <ReportEmptyState
                icon={Users}
                title="No creator revenue yet"
                description={
                  report.creatorCount === 0
                    ? "Add creators to your roster, then connect contracts or platform income."
                    : "Creators in your roster have no contract or platform revenue recorded for this month."
                }
                actionHref={
                  report.creatorCount === 0 ? "/creators" : "/creators"
                }
                actionLabel={
                  report.creatorCount === 0
                    ? "Add your first creator"
                    : "Review creators"
                }
              />
            ) : (
              <div className="space-y-3">
                {report.creatorLeaderboard.slice(0, 8).map((row) => (
                  <Link
                    key={row.id}
                    href={`/creators/${row.id}`}
                    className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-surface px-4 py-3 transition-colors hover:border-accent/20"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{row.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatBreakdown(row.contractRevenue, row.platformRevenue)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-accent-light">
                      {row.totalDisplay}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/[0.06] bg-surface-raised/80">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent-light" />
              <CardTitle className="text-base">Platform income</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {report.platformBreakdown.length === 0 ? (
              <ReportEmptyState
                icon={report.connectedAccountCount > 0 ? TrendingUp : Link2}
                title={
                  report.connectedAccountCount > 0
                    ? "No platform income this month"
                    : "No platform accounts connected"
                }
                description={
                  report.connectedAccountCount > 0
                    ? "OAuth accounts are linked but no revenue synced for this period yet. Run a manual sync or wait for the daily job."
                    : "Connect YouTube, Twitch, or other platforms on a creator profile to track platform income."
                }
                actionHref={
                  report.connectedAccountCount > 0 ? "/settings" : "/creators"
                }
                actionLabel={
                  report.connectedAccountCount > 0
                    ? "Open platform sync settings"
                    : "Connect a platform"
                }
              />
            ) : (
              <div className="space-y-3">
                {report.platformBreakdown.map((row) => (
                  <div
                    key={row.platform}
                    className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-surface px-4 py-3"
                  >
                    <p className="text-sm text-gray-300">{row.platform}</p>
                    <p className="text-sm font-medium text-white">
                      {row.totalDisplay}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {report.aiUsage.length > 0 ? (
        <Card className="border-white/[0.06] bg-surface-raised/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">AI usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {report.aiUsage.map((entry) => (
                <div
                  key={entry.assistantType}
                  className="rounded-xl border border-white/[0.06] bg-surface px-4 py-3"
                >
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {entry.assistantType}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {entry.requestCount}
                  </p>
                  <p className="text-xs text-gray-500">requests this month</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-white/[0.06] bg-surface-raised/80">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-400" />
              <CardTitle className="text-base">AI usage</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ReportEmptyState
              icon={Sparkles}
              title="No AI requests this month"
              description="Run growth, sponsorship, or contract summaries from the AI page to see usage here."
              actionHref="/ai"
              actionLabel="Open AI assistants"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatBreakdown(contract: number, platform: number): string {
  const parts: string[] = [];
  if (contract > 0) parts.push(`contracts ${formatCurrency(contract)}`);
  if (platform > 0) parts.push(`platform ${formatCurrency(platform)}`);
  return parts.join(" · ") || "No breakdown";
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
