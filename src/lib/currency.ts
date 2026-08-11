/** Amount-only formatting for serializable *Display fields (no `$` prefix). */
export function formatCurrencyAmount(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

/** Full currency string for direct JSX rendering. */
export function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
