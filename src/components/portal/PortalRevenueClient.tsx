"use client";

import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DollarSign, FileText } from "lucide-react";
import type { Creator } from "@/lib/creators";
import type { Contract } from "@/lib/contracts";
import {
  contractOverlapsPeriodMonth,
  formatCurrency,
  getContractExpectedLabel,
} from "@/lib/contracts";
import {
  formatPeriodMonth,
  type CreatorPlatformAccount,
  type CreatorRevenueEntry,
} from "@/lib/creator-revenue";
import type { ContractPayment } from "@/lib/payments/types";
import type { CreatorMonthlyRevenue, MonthlyRevenueTrendPoint } from "@/lib/revenue/monthly";
import {
  formatPaymentAmountDisplay,
  hasRecordedRevenueForMonth,
} from "@/lib/revenue/monthly";
import { CreatorPlatformAccounts } from "@/components/creators/CreatorPlatformAccounts";
import { MonthSelector } from "@/components/revenue/MonthSelector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { contractPaymentStatusLabels } from "@/lib/payments/types";
import type { OAuthPlatformUi } from "@/lib/platform-oauth/config";

const chartTooltipStyle = {
  backgroundColor: "#111520",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
  fontSize: "12px",
};

interface PortalRevenueClientProps {
  creator: Creator;
  contracts: Contract[];
  platformAccounts: CreatorPlatformAccount[];
  revenueEntries: CreatorRevenueEntry[];
  payments: ContractPayment[];
  summary: CreatorMonthlyRevenue;
  trend: MonthlyRevenueTrendPoint[];
  periodMonth: string;
  oauthPlatformUi: OAuthPlatformUi[];
}

export function PortalRevenueClient({
  creator,
  contracts,
  platformAccounts,
  revenueEntries,
  payments,
  summary,
  trend,
  periodMonth,
  oauthPlatformUi,
}: PortalRevenueClientProps) {
  const hasTrend = trend.some(
    (point) => point.cashReceived > 0 || point.platform > 0 || point.expectedDeals > 0
  );
  const periodLabel = formatPeriodMonth(periodMonth);
  const hasRecordedData = hasRecordedRevenueForMonth({
    platformEntries: revenueEntries,
    payments,
  });
  const showNoDataRecorded =
    !hasRecordedData &&
    summary.cashReceived === 0 &&
    summary.platformIncome.total === 0;

  const monthContracts = contracts.filter(
    (contract) =>
      contractOverlapsPeriodMonth(contract, periodMonth) ||
      payments.some((payment) => payment.contractId === contract.id)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthSelector periodMonth={periodMonth} />
        <Link
          href={`/creators/${creator.id}#income-overview`}
          className="text-sm font-medium text-accent-light hover:text-white"
        >
          View on profile →
        </Link>
      </div>

      {showNoDataRecorded ? (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-gray-400">
          No revenue recorded for {periodLabel}. Enter platform income below or receive deal
          payments to track earnings for this month.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_32px_rgba(16,185,129,0.08)]">
          <CardHeader className="pb-2">
            <CardDescription className="text-sm font-semibold text-emerald-300/90">
              Cash received
            </CardDescription>
            <p className="mt-2 text-5xl font-extrabold tracking-tight text-emerald-300">
              {formatCurrency(summary.cashReceived)}
            </p>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-emerald-300/60">{periodLabel}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Platform income</CardDescription>
            <p className="mt-2 text-xl font-medium text-gray-400">
              {formatCurrency(summary.platformIncome.total)}
            </p>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-gray-500">
            Self-reported and synced platform revenue
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Expected from deals</CardDescription>
            <p className="mt-2 text-xl font-medium text-gray-400">
              {formatCurrency(summary.expectedDeals)}
            </p>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-gray-500">
            Amortized sponsorship value this month
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-gray-500">
        Total income (cash + platform):{" "}
        <span className="font-medium text-gray-300">{formatCurrency(summary.total)}</span>
      </p>

      <Card>
        <CardHeader>
          <CardTitle>12-month trend</CardTitle>
          <CardDescription>Cash received and platform income over the last year</CardDescription>
        </CardHeader>
        <CardContent>
          {hasTrend ? (
            <div className="h-72 min-h-[18rem] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    formatter={(value) =>
                      typeof value === "number" ? formatCurrency(value) : String(value ?? "")
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="cashReceived"
                    stroke="#10B981"
                    fill="url(#cashGrad)"
                    strokeWidth={2}
                    name="Cash received"
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
              icon={DollarSign}
              title="No revenue history yet"
              description="Record platform income or receive deal payments to see trends"
              className="min-h-[18rem]"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent-light" />
            Your deals
          </CardTitle>
          <CardDescription>
            Sponsorship agreements active or paying out in {periodLabel}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {monthContracts.length === 0 ? (
            <p className="text-sm text-gray-500">
              No deals overlap {periodLabel}. Switch months to see other agreements or payments.
            </p>
          ) : (
            <ul className="space-y-3">
              {monthContracts.map((contract) => {
                const contractPayments = payments.filter(
                  (payment) => payment.contractId === contract.id
                );
                const expectedLabel = getContractExpectedLabel(contract, periodMonth);
                return (
                  <li
                    key={contract.id}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/contracts/${contract.id}`}
                          className="font-medium text-gray-100 hover:text-accent-light"
                        >
                          {contract.contractName}
                        </Link>
                        <p className="mt-1 text-xs text-gray-500">
                          {contract.sponsorName} · {contract.status}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-200">{expectedLabel}</p>
                        {contractPayments.length > 0 ? (
                          <p className="text-xs text-emerald-400">
                            {contractPayments.length} payment
                            {contractPayments.length === 1 ? "" : "s"} this month
                          </p>
                        ) : null}
                      </div>
                    </div>
                    {contractPayments.length > 0 ? (
                      <ul className="mt-3 space-y-2 border-t border-white/[0.06] pt-3">
                        {contractPayments.map((payment) => (
                          <li
                            key={payment.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-gray-400">
                              {contractPaymentStatusLabels[payment.status]}
                              {payment.paidAt
                                ? ` · ${new Date(payment.paidAt).toLocaleDateString()}`
                                : ""}
                            </span>
                            <span className="font-medium text-emerald-400">
                              {formatPaymentAmountDisplay(payment)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Platform income</CardTitle>
          <CardDescription>
            Enter monthly platform revenue. Synced rows are updated automatically from connected
            accounts.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <CreatorPlatformAccounts
            creator={creator}
            accounts={platformAccounts}
            revenueEntries={revenueEntries}
            oauthPlatformUi={oauthPlatformUi}
            canWrite
            allowPlatformOAuth
            periodMonth={periodMonth}
          />
        </CardContent>
      </Card>
    </div>
  );
}
