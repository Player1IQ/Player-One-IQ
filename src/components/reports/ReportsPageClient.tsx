"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
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
  const t = useTranslations("reports");
  const locale = useLocale();
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
              <span className="font-medium text-amber-200">{t("sparseBanner.title")}</span>{" "}
              {t("sparseBanner.description")}
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <Link href="/creators" className="text-accent-light hover:text-white">
                {t("sparseBanner.addCreators")}
              </Link>
              <Link href="/contracts" className="text-accent-light hover:text-white">
                {t("sparseBanner.createContract")}
              </Link>
              <Link href="/settings" className="text-accent-light hover:text-white">
                {t("sparseBanner.syncRevenue")}
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-white/[0.06] bg-surface-raised/80">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-sm text-gray-400">
              {t("periodCard.monthlyReportFor")}{" "}
              <span className="font-medium text-white">{report.periodLabel}</span>
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {t("periodCard.creators", { count: report.creatorCount })}
              {report.connectedAccountCount > 0
                ? ` · ${t("periodCard.platforms", { count: report.connectedAccountCount })}`
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
                  {t("periodCard.vsLastMonth", {
                    delta: report.revenueComparison.deltaDisplay,
                  })}
                </span>
              ) : null}
            </p>
          </div>
          <ExportReportMenu canExport variant="page" />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title={t("metrics.totalRevenue")}
          value={report.revenue.totalDisplay}
          subtitle={report.revenue.subtitle}
          icon={DollarSign}
          iconColor="text-accent-light"
        />
        <MetricCard
          title={t("metrics.contractPipeline")}
          value={report.contractStats.totalValueDisplay}
          subtitle={t("metrics.activeInPipeline", {
            count: report.contractStats.activeCount,
          })}
          icon={FileText}
          iconColor="text-fuchsia-400"
        />
        <MetricCard
          title={t("metrics.opportunities")}
          value={String(report.opportunityStats.openCount)}
          subtitle={t("metrics.totalOpportunities", {
            count: report.opportunityStats.totalCount,
          })}
          icon={Briefcase}
          iconColor="text-blue-400"
        />
        <MetricCard
          title={t("metrics.aiRequests")}
          value={String(aiRequestUsage?.count ?? 0)}
          subtitle={
            aiRequestUsage?.limit
              ? t("metrics.remainingThisMonth", {
                  count: aiRequestUsage.limit - aiRequestUsage.count,
                })
              : t("metrics.unlimitedPlan")
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
              <CardTitle className="text-base">{t("campaignSummary.title")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {report.campaignSummary.totalCount === 0 ? (
              <ReportEmptyState
                icon={Target}
                title={t("campaignSummary.emptyTitle")}
                description={t("campaignSummary.emptyDescription")}
                actionHref="/campaigns"
                actionLabel={t("campaignSummary.viewCampaigns")}
              />
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/[0.06] bg-surface px-4 py-3">
                    <p className="text-xs text-gray-500">{t("campaignSummary.active")}</p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {report.campaignSummary.activeCount}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-surface px-4 py-3">
                    <p className="text-xs text-gray-500">{t("campaignSummary.totalBudget")}</p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {report.campaignSummary.totalBudgetDisplay}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-surface px-4 py-3">
                    <p className="text-xs text-gray-500">{t("campaignSummary.totalCampaigns")}</p>
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
                      {t("campaignSummary.topByBudget")}
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
              <CardTitle className="text-base">{t("deliverableHealth.title")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {report.deliverableHealth.totalCount === 0 ? (
              <ReportEmptyState
                icon={ClipboardList}
                title={t("deliverableHealth.emptyTitle")}
                description={t("deliverableHealth.emptyDescription")}
                actionHref="/contracts"
                actionLabel={t("deliverableHealth.viewContracts")}
              />
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <MetricCard
                    title={t("deliverableHealth.completionRate")}
                    value={`${report.deliverableHealth.completionRatePercent}%`}
                    subtitle={t("deliverableHealth.completedOf", {
                      completed: report.deliverableHealth.completedCount,
                      total: report.deliverableHealth.totalCount,
                    })}
                    icon={CheckCircle2}
                    iconColor="text-emerald-400"
                  />
                  <MetricCard
                    title={t("deliverableHealth.overdue")}
                    value={String(report.deliverableHealth.overdueCount)}
                    subtitle={t("deliverableHealth.overdueSubtitle")}
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
                    <p className="text-xs text-gray-500">{t("deliverableHealth.pending")}</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-surface px-3 py-3 text-center">
                    <p className="text-lg font-semibold text-white">
                      {report.deliverableHealth.inProgressCount}
                    </p>
                    <p className="text-xs text-gray-500">{t("deliverableHealth.inProgress")}</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-surface px-3 py-3 text-center">
                    <p className="text-lg font-semibold text-white">
                      {report.deliverableHealth.completedCount}
                    </p>
                    <p className="text-xs text-gray-500">{t("deliverableHealth.completed")}</p>
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
            <CardTitle className="text-base">{t("sponsors.title")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {report.sponsorBreakdown.length === 0 ? (
            <ReportEmptyState
              icon={Building2}
              title={t("sponsors.emptyTitle")}
              description={t("sponsors.emptyDescription")}
              actionHref="/sponsors"
              actionLabel={t("sponsors.viewSponsors")}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="pb-2 pr-4 font-medium">{t("sponsors.columns.sponsor")}</th>
                    <th className="pb-2 pr-4 font-medium">{t("sponsors.columns.pipelineValue")}</th>
                    <th className="pb-2 pr-4 font-medium">{t("sponsors.columns.activeContracts")}</th>
                    <th className="pb-2 font-medium">{t("sponsors.columns.totalContracts")}</th>
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
              <CardTitle className="text-base">{t("creators.title")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {report.creatorLeaderboard.length === 0 ? (
              <ReportEmptyState
                icon={Users}
                title={t("creators.emptyNoRevenueTitle")}
                description={
                  report.creatorCount === 0
                    ? t("creators.emptyNoCreatorsDescription")
                    : t("creators.emptyHasCreatorsDescription")
                }
                actionHref="/creators"
                actionLabel={
                  report.creatorCount === 0
                    ? t("creators.addFirstCreator")
                    : t("creators.reviewCreators")
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
                        {formatBreakdown(
                          row.contractRevenue,
                          row.platformRevenue,
                          t,
                          locale
                        )}
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
              <CardTitle className="text-base">{t("platformIncome.title")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {report.platformBreakdown.length === 0 ? (
              <ReportEmptyState
                icon={report.connectedAccountCount > 0 ? TrendingUp : Link2}
                title={
                  report.connectedAccountCount > 0
                    ? t("platformIncome.emptyConnectedTitle")
                    : t("platformIncome.emptyNoAccountsTitle")
                }
                description={
                  report.connectedAccountCount > 0
                    ? t("platformIncome.emptyConnectedDescription")
                    : t("platformIncome.emptyNoAccountsDescription")
                }
                actionHref={
                  report.connectedAccountCount > 0 ? "/settings" : "/creators"
                }
                actionLabel={
                  report.connectedAccountCount > 0
                    ? t("platformIncome.openSyncSettings")
                    : t("platformIncome.connectPlatform")
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
            <CardTitle className="text-base">{t("aiUsage.title")}</CardTitle>
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
                  <p className="text-xs text-gray-500">{t("aiUsage.requestsThisMonth")}</p>
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
              <CardTitle className="text-base">{t("aiUsage.title")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ReportEmptyState
              icon={Sparkles}
              title={t("aiUsage.emptyTitle")}
              description={t("aiUsage.emptyDescription")}
              actionHref="/ai"
              actionLabel={t("aiUsage.openAi")}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatBreakdown(
  contract: number,
  platform: number,
  t: ReturnType<typeof useTranslations<"reports">>,
  locale: string
): string {
  const parts: string[] = [];
  if (contract > 0) {
    parts.push(
      t("creators.breakdown.contracts", {
        amount: formatCurrency(contract, locale),
      })
    );
  }
  if (platform > 0) {
    parts.push(
      t("creators.breakdown.platform", {
        amount: formatCurrency(platform, locale),
      })
    );
  }
  return parts.join(" · ") || t("creators.breakdown.none");
}

function formatCurrency(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
