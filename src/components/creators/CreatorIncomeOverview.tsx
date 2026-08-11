import {
  contractOverlapsPeriodMonth,
  formatCurrency,
  getContractExpectedLabel,
  type Contract,
} from "@/lib/contracts";
import {
  formatPeriodMonth,
  revenueTypeLabels,
  type CreatorRevenueEntry,
} from "@/lib/creator-revenue";
import type { ContractPayment } from "@/lib/payments/types";
import {
  buildCreatorMonthlyRevenue,
  filterPaymentsForPeriodMonth,
  formatPaymentAmountDisplay,
  hasRecordedRevenueForMonth,
} from "@/lib/revenue/monthly";
import { contractPaymentStatusLabels } from "@/lib/payments/types";

interface CreatorIncomeOverviewProps {
  contracts: Contract[];
  revenueEntries: CreatorRevenueEntry[];
  payments?: ContractPayment[];
  periodMonth: string;
}

export function CreatorIncomeOverview({
  contracts,
  revenueEntries,
  payments = [],
  periodMonth,
}: CreatorIncomeOverviewProps) {
  const summary = buildCreatorMonthlyRevenue({
    periodMonth,
    contracts,
    platformEntries: revenueEntries,
    payments,
  });
  const periodPayments = filterPaymentsForPeriodMonth(payments, periodMonth);
  const periodLabel = formatPeriodMonth(periodMonth);
  const showNoDataRecorded =
    !hasRecordedRevenueForMonth({
      platformEntries: revenueEntries,
      payments: periodPayments,
    }) &&
    summary.cashReceived === 0 &&
    summary.platformIncome.total === 0;

  return (
    <div className="space-y-6">
      {showNoDataRecorded ? (
        <div className="rounded-lg border border-border-subtle bg-surface px-4 py-3 text-sm text-gray-500">
          No revenue recorded for {periodLabel}.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Cash received
          </p>
          <p className="mt-2 text-2xl font-bold text-white">
            {formatCurrency(summary.cashReceived)}
          </p>
          <p className="mt-1 text-xs text-gray-500">{periodLabel}</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Platform income
          </p>
          <p className="mt-2 text-2xl font-bold text-white">
            {formatCurrency(summary.platformIncome.total)}
          </p>
          <p className="mt-1 text-xs text-gray-500">Ads, subs, donations, other</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Expected from deals
          </p>
          <p className="mt-2 text-2xl font-bold text-white">
            {formatCurrency(summary.expectedDeals)}
          </p>
          <p className="mt-1 text-xs text-gray-500">Amortized deal value</p>
        </div>
      </div>

      <div className="rounded-lg border border-border-subtle bg-surface px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-gray-500">
          Total income (cash + platform)
        </p>
        <p className="mt-1 text-xl font-semibold text-white">
          {formatCurrency(summary.total)}
        </p>
      </div>

      {periodPayments.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-300">Deal payments received</h3>
          <ul className="mt-3 space-y-2">
            {periodPayments.map((payment) => {
              const contract = contracts.find((c) => c.id === payment.contractId);
              return (
                <li
                  key={payment.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-subtle bg-surface px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-gray-100">
                      {contract?.contractName ?? "Deal payment"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {contractPaymentStatusLabels[payment.status]}
                      {payment.paidAt
                        ? ` · ${new Date(payment.paidAt).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                  <span className="font-medium text-emerald-400">
                    {formatPaymentAmountDisplay(payment)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {summary.platformIncome.total > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-gray-300">By income type</h3>
            <dl className="mt-3 space-y-2">
              {(
                [
                  "advertisement",
                  "subscription",
                  "donations",
                  "other",
                ] as const
              ).map((type) => {
                const value = summary.platformIncome[type];
                if (value <= 0) return null;
                return (
                  <div
                    key={type}
                    className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface px-4 py-3 text-sm"
                  >
                    <dt className="text-gray-400">{revenueTypeLabels[type]}</dt>
                    <dd className="font-medium text-gray-100">
                      {formatCurrency(value)}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-300">By platform</h3>
            <dl className="mt-3 space-y-2">
              {summary.platformIncome.byPlatform.map((row) => (
                <div
                  key={row.platform}
                  className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface px-4 py-3 text-sm"
                >
                  <dt className="text-gray-400">{row.platform}</dt>
                  <dd className="font-medium text-gray-100">
                    {row.totalDisplay}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      {contracts.some((contract) =>
        contractOverlapsPeriodMonth(contract, periodMonth)
      ) && (
        <div>
          <h3 className="text-sm font-medium text-gray-300">Expected deal value</h3>
          <ul className="mt-3 space-y-2">
            {contracts
              .filter((contract) => contractOverlapsPeriodMonth(contract, periodMonth))
              .map((contract) => (
                <li
                  key={contract.id}
                  className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface px-4 py-3 text-sm"
                >
                  <span className="text-gray-300">{contract.contractName}</span>
                  <span className="font-medium text-gray-100">
                    {getContractExpectedLabel(contract, periodMonth)}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {summary.total === 0 && summary.expectedDeals === 0 && !showNoDataRecorded && (
        <p className="text-sm text-gray-500">
          Connect platform accounts and add contract deals to see a full income
          overview for this month.
        </p>
      )}
    </div>
  );
}
