"use client";

import { useLocale } from "next-intl";

export function useFormatDate() {
  const locale = useLocale();
  return (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
    const value = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat(locale, options).format(value);
  };
}

export function useFormatNumber() {
  const locale = useLocale();
  return (value: number, options?: Intl.NumberFormatOptions) =>
    new Intl.NumberFormat(locale, options).format(value);
}

export function useFormatCurrency() {
  const locale = useLocale();
  return (amount: number, currency: string, options?: Intl.NumberFormatOptions) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      ...options,
    }).format(amount);
}
