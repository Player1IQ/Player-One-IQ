import { getRequestConfig } from "next-intl/server";
import type { AppLocale } from "@/i18n/config";
import { resolveLocale } from "@/lib/i18n/locale";

async function loadMessages(locale: AppLocale) {
  const [
    common,
    nav,
    commandPalette,
    team,
    subscription,
    status,
  ] = await Promise.all([
    import(`../../messages/${locale}/common.json`),
    import(`../../messages/${locale}/nav.json`),
    import(`../../messages/${locale}/commandPalette.json`),
    import(`../../messages/${locale}/team.json`),
    import(`../../messages/${locale}/subscription.json`),
    import(`../../messages/${locale}/status.json`),
  ]);

  return {
    ...common.default,
    nav: nav.default,
    commandPalette: commandPalette.default,
    team: team.default,
    subscription: subscription.default,
    status: status.default,
  };
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();

  return {
    locale,
    messages: await loadMessages(locale),
    onError(error) {
      if (process.env.NODE_ENV !== "development") return;

      if (error.code === "MISSING_MESSAGE") {
        console.warn(
          `[i18n] Missing translation: ${error.message} (locale: ${locale})`
        );
        return;
      }

      console.error("[i18n]", error);
    },
    getMessageFallback({ namespace, key, error }) {
      if (
        process.env.NODE_ENV === "development" &&
        error.code === "MISSING_MESSAGE"
      ) {
        return namespace ? `${namespace}.${key}` : key;
      }

      return key;
    },
  };
});
