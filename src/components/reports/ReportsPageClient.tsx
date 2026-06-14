"use client";

import Link from "next/link";
import {
  Briefcase,
  DollarSign,
  FileText,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import type { MonthlyReportData } from "@/lib/reports/build";
import { ExportReportMenu } from "@/components/reports/ExportReportMenu";
import { MetricCard } from "@/components/ui/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface ReportsPageClientProps {
  report: MonthlyReportData;
}

export function ReportsPageClient({ report }: ReportsPageClientProps) {
  const aiRequestUsage = report.usage.find(
    (entry) => entry.metricKey === "ai_requests"
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <Card className="border-white/[0.06] bg-surface-raised/80">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <p className="text-sm text-gray-400">
            Monthly report for{" "}
            <span className="font-medium text-white">{report.periodLabel}</span>
          </p>
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
              <Users className="h-5 w-5 text-accent-light" />
              <CardTitle className="text-base">Top creators by revenue</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {report.creatorLeaderboard.length === 0 ? (
              <p className="text-sm text-gray-500">
                No creator revenue recorded this month yet.
              </p>
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
              <p className="text-sm text-gray-500">
                Connect creator platforms or sync OAuth accounts to see breakdown.
              </p>
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
      ) : null}
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
