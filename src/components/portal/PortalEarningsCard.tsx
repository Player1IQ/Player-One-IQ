"use client";

import Link from "next/link";
import { DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/contracts";
import type { DashboardRevenueSummary } from "@/lib/revenue/summary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

interface PortalEarningsCardProps {
  summary: DashboardRevenueSummary;
}

export function PortalEarningsCard({
  summary,
}: PortalEarningsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-emerald-400" />
          Your earnings this month
        </CardTitle>
        <CardDescription>
          Cash received from deals plus connected platform income
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total this month
            </p>
            <p className="mt-1 text-2xl font-bold text-white">
              {formatCurrency(summary.total)}
            </p>
            <p className="mt-1 text-xs text-gray-500">{summary.subtitle}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Cash received
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-100">
              {formatCurrency(summary.cashReceived)}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Platform income
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-100">
              {formatCurrency(summary.platformRevenue)}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Expected deals
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-100">
              {formatCurrency(summary.expectedDeals)}
            </p>
          </div>
        </div>

        <Link
          href="/portal/revenue"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-light hover:text-white"
        >
          View full revenue →
        </Link>
      </CardContent>
    </Card>
  );
}
