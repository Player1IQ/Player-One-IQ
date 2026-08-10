import { formatCurrency, getContractMonthlyValue, type Contract } from "@/lib/contracts";
import {
  getCurrentPeriodMonth,
  summarizeCreatorIncome,
  summarizeOrganizationPlatformRevenue,
  type CreatorRevenueEntry,
} from "@/lib/creator-revenue";
import {
  formatAmountCents,
  type ContractPayment,
  type ContractPaymentStatus,
} from "@/lib/payments/types";

export const PAID_PAYMENT_STATUSES: ContractPaymentStatus[] = [
  "paid_external",
  "paid_platform",
];

export interface MonthlyRevenueBreakdown {
  periodMonth: string;
  cashReceived: number;
  cashReceivedDisplay: string;
  expectedDeals: number;
  expectedDealsDisplay: string;
  platformRevenue: number;
  platformRevenueDisplay: string;
  total: number;
  totalDisplay: string;
}

export interface CreatorMonthlyRevenue extends MonthlyRevenueBreakdown {
  platformIncome: ReturnType<typeof summarizeCreatorIncome>;
}

export interface MonthlyRevenueTrendPoint {
  month: string;
  monthKey: string;
  cashReceived: number;
  expectedDeals: number;
  platform: number;
  total: number;
}

const PERIOD_MONTH_PATTERN = /^\d{4}-\d{2}-01$/;

export function normalizePeriodMonth(
  input: string | undefined | null,
  fallback = getCurrentPeriodMonth()
): string {
  if (!input || !PERIOD_MONTH_PATTERN.test(input)) {
    return fallback;
  }

  const date = new Date(`${input}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return input;
}

export function getPeriodMonthFromSearchParams(
  searchParams: Record<string, string | string[] | undefined> | URLSearchParams,
  paramName = "month"
): string {
  const raw =
    searchParams instanceof URLSearchParams
      ? searchParams.get(paramName)
      : typeof searchParams[paramName] === "string"
        ? searchParams[paramName]
        : Array.isArray(searchParams[paramName])
          ? searchParams[paramName][0]
          : undefined;

  return normalizePeriodMonth(raw ?? undefined);
}

export function getMonthBounds(periodMonth: string): { start: Date; end: Date } {
  const start = new Date(`${periodMonth}T00:00:00`);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function periodMonthFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

export function isPaidPaymentStatus(status: ContractPaymentStatus): boolean {
  return PAID_PAYMENT_STATUSES.includes(status);
}

export function paymentPaidInPeriodMonth(
  payment: Pick<ContractPayment, "paidAt" | "status">,
  periodMonth: string
): boolean {
  if (!payment.paidAt || !isPaidPaymentStatus(payment.status)) {
    return false;
  }

  const paidAt = new Date(payment.paidAt);
  if (Number.isNaN(paidAt.getTime())) {
    return false;
  }

  const { start, end } = getMonthBounds(periodMonth);
  return paidAt >= start && paidAt <= end;
}

export function filterPaymentsForPeriodMonth(
  payments: ContractPayment[],
  periodMonth: string
): ContractPayment[] {
  return payments.filter((payment) => paymentPaidInPeriodMonth(payment, periodMonth));
}

export function sumCashReceivedCents(payments: ContractPayment[]): number {
  return payments.reduce((sum, payment) => sum + payment.amountCents, 0);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function sumCashReceivedDollars(payments: ContractPayment[]): number {
  return centsToDollars(sumCashReceivedCents(payments));
}

export function getExpectedDealsValue(
  contracts: Contract[],
  periodMonth: string
): number {
  const monthDate = new Date(`${periodMonth}T00:00:00`);
  return contracts.reduce(
    (sum, contract) => sum + getContractMonthlyValue(contract, monthDate),
    0
  );
}

export function buildMonthlyRevenueBreakdown(params: {
  periodMonth: string;
  contracts: Contract[];
  platformEntries: CreatorRevenueEntry[];
  payments: ContractPayment[];
  connectedAccountCount?: number;
}): MonthlyRevenueBreakdown {
  const periodPayments = filterPaymentsForPeriodMonth(
    params.payments,
    params.periodMonth
  );
  const cashReceived = sumCashReceivedDollars(periodPayments);
  const expectedDeals = getExpectedDealsValue(params.contracts, params.periodMonth);
  const platformSummary = summarizeOrganizationPlatformRevenue(
    params.platformEntries,
    params.connectedAccountCount ?? 0
  );
  const total = cashReceived + platformSummary.platformRevenue;

  return {
    periodMonth: params.periodMonth,
    cashReceived,
    cashReceivedDisplay: formatCurrency(cashReceived),
    expectedDeals,
    expectedDealsDisplay: formatCurrency(expectedDeals),
    platformRevenue: platformSummary.platformRevenue,
    platformRevenueDisplay: platformSummary.platformRevenueDisplay,
    total,
    totalDisplay: formatCurrency(total),
  };
}

export function buildCreatorMonthlyRevenue(params: {
  periodMonth: string;
  contracts: Contract[];
  platformEntries: CreatorRevenueEntry[];
  payments: ContractPayment[];
}): CreatorMonthlyRevenue {
  const breakdown = buildMonthlyRevenueBreakdown(params);
  return {
    ...breakdown,
    platformIncome: summarizeCreatorIncome(params.platformEntries),
  };
}

export function buildMonthlyRevenueSubtitle(
  breakdown: Pick<
    MonthlyRevenueBreakdown,
    "cashReceived" | "expectedDeals" | "platformRevenue"
  >
): string {
  const parts: string[] = [];

  if (breakdown.cashReceived > 0) {
    parts.push(`${formatCurrency(breakdown.cashReceived)} cash received`);
  }

  if (breakdown.platformRevenue > 0) {
    parts.push(`${formatCurrency(breakdown.platformRevenue)} platform income`);
  }

  if (parts.length === 0 && breakdown.expectedDeals > 0) {
    parts.push(`${formatCurrency(breakdown.expectedDeals)} expected from deals`);
  } else if (breakdown.expectedDeals > 0) {
    parts.push(`${formatCurrency(breakdown.expectedDeals)} expected from deals`);
  }

  if (parts.length === 0) {
    return "Connect platforms or record deal payments to track revenue";
  }

  return parts.join(" · ");
}

export function buildMonthlyRevenueTrend(
  monthKeys: { key: string; label: string }[],
  contracts: Contract[],
  entriesByMonth: Map<string, CreatorRevenueEntry[]>,
  payments: ContractPayment[]
): MonthlyRevenueTrendPoint[] {
  return monthKeys.map(({ key, label }) => {
    const monthPayments = filterPaymentsForPeriodMonth(payments, key);
    const cashReceived = sumCashReceivedDollars(monthPayments);
    const expectedDeals = getExpectedDealsValue(contracts, key);
    const entries = entriesByMonth.get(key) ?? [];
    const platform = entries.reduce((sum, entry) => sum + entry.amount, 0);

    return {
      month: label,
      monthKey: key,
      cashReceived,
      expectedDeals,
      platform,
      total: cashReceived + platform,
    };
  });
}

export function formatPaymentAmountDisplay(payment: ContractPayment): string {
  return payment.amountDisplay || formatAmountCents(payment.amountCents, payment.currency);
}
