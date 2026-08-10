"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  formatPeriodMonth,
  getCurrentPeriodMonth,
} from "@/lib/creator-revenue";
import { normalizePeriodMonth } from "@/lib/revenue/monthly";

interface MonthSelectorProps {
  periodMonth: string;
  paramName?: string;
  className?: string;
}

function shiftPeriodMonth(periodMonth: string, delta: number): string {
  const date = new Date(`${periodMonth}T00:00:00`);
  date.setMonth(date.getMonth() + delta);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

export function MonthSelector({
  periodMonth,
  paramName = "month",
  className = "",
}: MonthSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentMonth = getCurrentPeriodMonth();
  const normalized = normalizePeriodMonth(periodMonth);
  const isCurrentMonth = normalized === currentMonth;

  function navigateToMonth(nextMonth: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextMonth === currentMonth) {
      params.delete(paramName);
    } else {
      params.set(paramName, nextMonth);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface px-2 py-1 ${className}`}
    >
      <button
        type="button"
        onClick={() => navigateToMonth(shiftPeriodMonth(normalized, -1))}
        className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
        aria-label="Previous month"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="min-w-[9rem] text-center">
        <p className="text-sm font-medium text-gray-100">
          {formatPeriodMonth(normalized)}
        </p>
        {!isCurrentMonth ? (
          <button
            type="button"
            onClick={() => navigateToMonth(currentMonth)}
            className="text-xs text-accent-light hover:text-white"
          >
            Back to current
          </button>
        ) : (
          <p className="text-xs text-gray-500">Current month</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => navigateToMonth(shiftPeriodMonth(normalized, 1))}
        disabled={isCurrentMonth}
        className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Next month"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

