import { formatCurrency, getContractMonthlyValue, type Contract } from "@/lib/contracts";
import {
  formatPeriodMonth,
  getCurrentPeriodMonth,
  revenueTypeLabels,
  summarizeCreatorIncome,
  type CreatorRevenueEntry,
} from "@/lib/creator-revenue";

interface CreatorIncomeOverviewProps {
  contracts: Contract[];
  revenueEntries: CreatorRevenueEntry[];
}

export function CreatorIncomeOverview({
  contracts,
  revenueEntries,
}: CreatorIncomeOverviewProps) {
  const platformIncome = summarizeCreatorIncome(revenueEntries);
  const contractIncome = contracts.reduce(
    (sum, contract) => sum + getContractMonthlyValue(contract),
    0
  );
  const total = platformIncome.total + contractIncome;
  const periodLabel = formatPeriodMonth(getCurrentPeriodMonth());

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border-subtle bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Total this month
          </p>
          <p className="mt-2 text-2xl font-bold text-white">
            {formatCurrency(total)}
          </p>
          <p className="mt-1 text-xs text-gray-500">{periodLabel}</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Platform income
          </p>
          <p className="mt-2 text-2xl font-bold text-white">
            {platformIncome.totalDisplay}
          </p>
          <p className="mt-1 text-xs text-gray-500">Ads, subs, donations</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Contract income
          </p>
          <p className="mt-2 text-2xl font-bold text-white">
            {formatCurrency(contractIncome)}
          </p>
          <p className="mt-1 text-xs text-gray-500">Sponsorship deals</p>
        </div>
      </div>

      {platformIncome.total > 0 && (
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
                const value = platformIncome[type];
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
              {platformIncome.byPlatform.map((row) => (
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

      {total === 0 && (
        <p className="text-sm text-gray-500">
          Connect platform accounts and add contract deals to see a full income
          overview for this creator.
        </p>
      )}
    </div>
  );
}
