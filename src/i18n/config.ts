export const locales = ["en", "es"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en";

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

export const localeNames: Record<AppLocale, string> = {
  en: "English",
  es: "Español",
};

export const localeDirections: Record<AppLocale, "ltr" | "rtl"> = {
  en: "ltr",
  es: "ltr",
};

export function isAppLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value);
}

export function getLocaleDirection(locale: AppLocale): "ltr" | "rtl" {
  return localeDirections[locale];
}
