import { getRequestConfig } from "next-intl/server";
import { resolveLocale } from "@/lib/i18n/locale";

export default getRequestConfig(async () => {
  const locale = await resolveLocale();

  return {
    locale,
    messages: (await import(`../../messages/${locale}/common.json`)).default,
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
