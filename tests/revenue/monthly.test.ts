import assert from "node:assert/strict";
import { test } from "node:test";
import type { Contract } from "@/lib/contracts";
import {
  contractOverlapsPeriodMonth,
  getContractExpectedLabel,
} from "@/lib/contracts";
import type { ContractPayment } from "@/lib/payments/types";
import type { CreatorRevenueEntry } from "@/lib/creator-revenue";
import {
  buildCreatorMonthlyRevenue,
  buildMonthlyRevenueBreakdown,
  buildMonthlyRevenueSubtitle,
  buildMonthlyRevenueTrend,
  filterPaymentsForPeriodMonth,
  getExpectedDealsValue,
  hasRecordedRevenueForMonth,
  normalizePeriodMonth,
  paymentPaidInPeriodMonth,
  sumCashReceivedCents,
  sumCashReceivedDollars,
} from "@/lib/revenue/monthly";
import { getDashboardRevenueSummary } from "@/lib/revenue/summary";

const baseContract = (overrides: Partial<Contract> = {}): Contract =>
  ({
    id: "contract-1",
    contractName: "Brand Deal",
    creatorId: "creator-1",
    sponsorName: "Acme",
    creatorName: "Creator",
    status: "active",
    contractValue: 12000,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    ...overrides,
  }) as Contract;

const basePayment = (overrides: Partial<ContractPayment> = {}): ContractPayment =>
  ({
    id: "payment-1",
    organizationId: "org-1",
    contractId: "contract-1",
    payeeType: "creator",
    payeeCreatorId: "creator-1",
    payeeRecipientId: null,
    amountCents: 250000,
    currency: "usd",
    status: "paid_external",
    paymentMethod: "external",
    paidAt: "2026-08-15T12:00:00.000Z",
    externalReference: null,
    notes: null,
    payeeName: "Creator",
    amountDisplay: "$2,500.00",
    payoutInstructions: null,
    createdAt: "2026-08-15T12:00:00.000Z",
    updatedAt: "2026-08-15T12:00:00.000Z",
    ...overrides,
  }) as ContractPayment;

const baseEntry = (overrides: Partial<CreatorRevenueEntry> = {}): CreatorRevenueEntry =>
  ({
    id: "entry-1",
    organizationId: "org-1",
    creatorId: "creator-1",
    platformAccountId: "account-1",
    platform: "YouTube",
    revenueType: "advertisement",
    amount: 500,
    amountDisplay: "$500.00",
    currency: "USD",
    periodMonth: "2026-08-01",
    source: "manual",
    notes: null,
    ...overrides,
  }) as CreatorRevenueEntry;

test("normalizePeriodMonth accepts YYYY-MM-01 and falls back safely", () => {
  assert.equal(normalizePeriodMonth("2026-08-01", "2026-01-01"), "2026-08-01");
  assert.equal(normalizePeriodMonth("2026-8-01", "2026-01-01"), "2026-01-01");
  assert.equal(normalizePeriodMonth(undefined, "2026-01-01"), "2026-01-01");
});

test("paymentPaidInPeriodMonth matches paid_at within month bounds", () => {
  assert.equal(
    paymentPaidInPeriodMonth(basePayment(), "2026-08-01"),
    true
  );
  assert.equal(
    paymentPaidInPeriodMonth(
      basePayment({ paidAt: "2026-07-31T23:59:59.000Z" }),
      "2026-08-01"
    ),
    false
  );
  assert.equal(
    paymentPaidInPeriodMonth(
      basePayment({ status: "ready" }),
      "2026-08-01"
    ),
    false
  );
});

test("sumCashReceived converts cents to dollars", () => {
  const payments = [
    basePayment({ amountCents: 100000 }),
    basePayment({ id: "payment-2", amountCents: 5050 }),
  ];
  assert.equal(sumCashReceivedCents(payments), 105050);
  assert.equal(sumCashReceivedDollars(payments), 1050.5);
});

test("getExpectedDealsValue amortizes active contracts for selected month", () => {
  const contracts = [baseContract()];
  const expected = getExpectedDealsValue(contracts, "2026-08-01");
  assert.equal(expected, 1000);
});

test("buildMonthlyRevenueBreakdown prioritizes cash received plus platform income", () => {
  const breakdown = buildMonthlyRevenueBreakdown({
    periodMonth: "2026-08-01",
    contracts: [baseContract()],
    platformEntries: [baseEntry()],
    payments: [basePayment()],
    connectedAccountCount: 1,
  });

  assert.equal(breakdown.cashReceived, 2500);
  assert.equal(breakdown.platformRevenue, 500);
  assert.equal(breakdown.total, 3000);
  assert.equal(breakdown.expectedDeals, 1000);
});

test("buildCreatorMonthlyRevenue includes platform income summary", () => {
  const summary = buildCreatorMonthlyRevenue({
    periodMonth: "2026-08-01",
    contracts: [baseContract()],
    platformEntries: [baseEntry()],
    payments: [basePayment()],
  });

  assert.equal(summary.platformIncome.total, 500);
  assert.equal(summary.total, 3000);
});

test("buildMonthlyRevenueSubtitle describes cash, platform, and expected deals", () => {
  const subtitle = buildMonthlyRevenueSubtitle({
    cashReceived: 2500,
    platformRevenue: 500,
    expectedDeals: 1000,
  });
  assert.match(subtitle, /\$2,500 cash received/);
  assert.match(subtitle, /\$500 platform income/);
  assert.match(subtitle, /\$1,000 expected from deals/);
});

test("buildMonthlyRevenueTrend aggregates by month key", () => {
  const monthKeys = [
    { key: "2026-07-01", label: "Jul" },
    { key: "2026-08-01", label: "Aug" },
  ];
  const entriesByMonth = new Map<string, CreatorRevenueEntry[]>([
    ["2026-08-01", [baseEntry()]],
  ]);
  const trend = buildMonthlyRevenueTrend(
    monthKeys,
    [baseContract()],
    entriesByMonth,
    [basePayment()]
  );

  assert.equal(trend.length, 2);
  assert.equal(trend[1]?.cashReceived, 2500);
  assert.equal(trend[1]?.platform, 500);
  assert.equal(trend[1]?.expectedDeals, 1000);
});

test("getDashboardRevenueSummary exposes cash-first fields", () => {
  const summary = getDashboardRevenueSummary(
    [baseContract()],
    [baseEntry()],
    1,
    { periodMonth: "2026-08-01", payments: [basePayment()] }
  );

  assert.equal(summary.cashReceived, 2500);
  assert.equal(summary.expectedDeals, 1000);
  assert.equal(summary.total, 3000);
  assert.equal(summary.contractRevenue, summary.expectedDeals);
  assert.match(summary.subtitle, /cash received/);
});

test("filterPaymentsForPeriodMonth returns only in-month paid payments", () => {
  const payments = [
    basePayment(),
    basePayment({
      id: "payment-2",
      paidAt: "2026-10-01T00:00:00.000Z",
    }),
  ];
  const filtered = filterPaymentsForPeriodMonth(payments, "2026-08-01");
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.id, "payment-1");
});

test("contractOverlapsPeriodMonth respects deal date windows", () => {
  const contract = baseContract({
    startDate: "2026-08-01",
    endDate: "2026-09-30",
  });

  assert.equal(contractOverlapsPeriodMonth(contract, "2026-08-01"), true);
  assert.equal(contractOverlapsPeriodMonth(contract, "2026-12-01"), false);
  assert.equal(contractOverlapsPeriodMonth(contract, "2026-03-01"), false);
});

test("getContractExpectedLabel explains non-active deals", () => {
  const draft = baseContract({
    status: "draft",
    startDate: "2026-08-01",
    endDate: "2026-09-30",
  });

  assert.equal(
    getContractExpectedLabel(draft, "2026-08-01"),
    "Draft — not counted"
  );
});

test("buildMonthlyRevenueBreakdown display fields omit currency prefix for RSC safety", () => {
  const breakdown = buildMonthlyRevenueBreakdown({
    periodMonth: "2026-08-01",
    contracts: [baseContract()],
    platformEntries: [baseEntry()],
    payments: [basePayment()],
    connectedAccountCount: 1,
  });

  assert.equal(breakdown.cashReceivedDisplay, "2,500");
  assert.equal(breakdown.expectedDealsDisplay, "1,000");
  assert.equal(breakdown.platformRevenueDisplay, "500");
  assert.equal(breakdown.totalDisplay, "3,000");

  for (const display of [
    breakdown.cashReceivedDisplay,
    breakdown.expectedDealsDisplay,
    breakdown.platformRevenueDisplay,
    breakdown.totalDisplay,
  ]) {
    assert.doesNotMatch(display, /^\$/);
  }
});

test("hasRecordedRevenueForMonth detects platform entries and payments", () => {
  assert.equal(
    hasRecordedRevenueForMonth({
      platformEntries: [],
      payments: [],
    }),
    false
  );
  assert.equal(
    hasRecordedRevenueForMonth({
      platformEntries: [baseEntry()],
      payments: [],
    }),
    true
  );
  assert.equal(
    hasRecordedRevenueForMonth({
      platformEntries: [],
      payments: [basePayment()],
    }),
    true
  );
});
