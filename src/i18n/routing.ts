import { defineRouting } from "next-intl/routing";
import { defaultLocale, LOCALE_COOKIE_NAME, locales } from "./config";

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  localePrefix: "never",
  localeCookie: {
    name: LOCALE_COOKIE_NAME,
  },
});
