import type { Contract } from "@/lib/contracts";
import { getContractMonthlyValue } from "@/lib/contracts";
import type { Creator } from "@/lib/creators";
import type { CreatorRevenueEntry } from "@/lib/creator-revenue";

export interface MonthKey {
  key: string;
  label: string;
}

export interface RevenueTrendPoint {
  month: string;
  contract: number;
  platform: number;
  total: number;
}

export interface CreatorGrowthPoint {
  month: string;
  creators: number;
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function getLastNMonthKeys(n = 6, now = new Date()): MonthKey[] {
  const months: MonthKey[] = [];

  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    months.push({
      key: `${year}-${month}-01`,
      label: MONTH_LABELS[date.getMonth()],
    });
  }

  return months;
}

function monthReferenceDate(monthKey: string): Date {
  return new Date(monthKey + "T00:00:00");
}

function endOfMonth(monthKey: string): Date {
  const start = monthReferenceDate(monthKey);
  return new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function buildRevenueTrendData(
  contracts: Contract[],
  entriesByMonth: Map<string, CreatorRevenueEntry[]>
): RevenueTrendPoint[] {
  const monthKeys = getLastNMonthKeys();

  return monthKeys.map(({ key, label }) => {
    const monthDate = monthReferenceDate(key);
    const contractRevenue = contracts.reduce(
      (sum, contract) => sum + getContractMonthlyValue(contract, monthDate),
      0
    );
    const entries = entriesByMonth.get(key) ?? [];
    const platformRevenue = entries.reduce((sum, entry) => sum + entry.amount, 0);

    return {
      month: label,
      contract: contractRevenue,
      platform: platformRevenue,
      total: contractRevenue + platformRevenue,
    };
  });
}

export function buildCreatorGrowthData(
  creators: Creator[],
  now = new Date()
): CreatorGrowthPoint[] {
  const monthKeys = getLastNMonthKeys(6, now);

  return monthKeys.map(({ key, label }) => {
    const cutoff = endOfMonth(key);
    const count = creators.filter((creator) => {
      const createdAt = new Date(creator.createdAt);
      return createdAt <= cutoff;
    }).length;

    return { month: label, creators: count };
  });
}

export function groupRevenueEntriesByMonth(
  entries: CreatorRevenueEntry[]
): Map<string, CreatorRevenueEntry[]> {
  const byMonth = new Map<string, CreatorRevenueEntry[]>();

  for (const entry of entries) {
    const existing = byMonth.get(entry.periodMonth) ?? [];
    existing.push(entry);
    byMonth.set(entry.periodMonth, existing);
  }

  return byMonth;
}

export function hasRevenueTrendData(points: RevenueTrendPoint[]): boolean {
  return points.some((point) => point.contract > 0 || point.platform > 0);
}

export function hasCreatorGrowthData(points: CreatorGrowthPoint[]): boolean {
  return points.some((point) => point.creators > 0);
}
