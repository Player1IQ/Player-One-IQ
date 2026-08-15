import { getLocale } from "next-intl/server";

export async function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): Promise<string> {
  const locale = await getLocale();
  const value = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(locale, options).format(value);
}

export async function formatCurrency(
  amount: number,
  currency: string,
  options?: Intl.NumberFormatOptions
): Promise<string> {
  const locale = await getLocale();
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    ...options,
  }).format(amount);
}

export async function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions
): Promise<string> {
  const locale = await getLocale();
  return new Intl.NumberFormat(locale, options).format(value);
}
