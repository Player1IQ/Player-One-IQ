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

interface ReportsPageClientProps {
  report: MonthlyReportData;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {title}
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className="rounded-lg bg-accent/10 p-2 ring-1 ring-accent/20">
          <Icon className="h-5 w-5 text-accent-light" />
        </div>
      </div>
    </div>
  );
}

export function ReportsPageClient({ report }: ReportsPageClientProps) {
  const aiRequestUsage = report.usage.find(
    (entry) => entry.metricKey === "ai_requests"
  );

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-surface-raised px-5 py-4">
        <p className="text-sm text-gray-400">
          Monthly report for{" "}
          <span className="font-medium text-white">{report.periodLabel}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total revenue"
          value={report.revenue.totalDisplay}
          subtitle={report.revenue.subtitle}
          icon={DollarSign}
        />
        <StatCard
          title="Contract pipeline"
          value={report.contractStats.totalValueDisplay}
          subtitle={`${report.contractStats.activeCount} active in pipeline`}
          icon={FileText}
        />
        <StatCard
          title="Opportunities"
          value={String(report.opportunityStats.openCount)}
          subtitle={`${report.opportunityStats.totalCount} total opportunities`}
          icon={Briefcase}
        />
        <StatCard
          title="AI requests"
          value={String(aiRequestUsage?.count ?? 0)}
          subtitle={
            aiRequestUsage?.limit
              ? `${aiRequestUsage.limit - aiRequestUsage.count} remaining this month`
              : "Unlimited on your plan"
          }
          icon={Sparkles}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface-raised p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-accent-light" />
            <h2 className="text-base font-semibold text-white">
              Top creators by revenue
            </h2>
          </div>
          {report.creatorLeaderboard.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              No creator revenue recorded this month yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {report.creatorLeaderboard.slice(0, 8).map((row) => (
                <Link
                  key={row.id}
                  href={`/creators/${row.id}`}
                  className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface px-4 py-3 hover:border-accent/20"
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
        </section>

        <section className="rounded-xl border border-border bg-surface-raised p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent-light" />
            <h2 className="text-base font-semibold text-white">
              Platform income
            </h2>
          </div>
          {report.platformBreakdown.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              Connect creator platforms or sync OAuth accounts to see breakdown.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {report.platformBreakdown.map((row) => (
                <div
                  key={row.platform}
                  className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface px-4 py-3"
                >
                  <p className="text-sm text-gray-300">{row.platform}</p>
                  <p className="text-sm font-medium text-white">
                    {row.totalDisplay}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {report.aiUsage.length > 0 ? (
        <section className="rounded-xl border border-border bg-surface-raised p-6">
          <h2 className="text-base font-semibold text-white">AI usage</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {report.aiUsage.map((entry) => (
              <div
                key={entry.assistantType}
                className="rounded-lg border border-border-subtle bg-surface px-4 py-3"
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
        </section>
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
