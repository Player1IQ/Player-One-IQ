import { getRequestConfig } from "next-intl/server";
import type { AppLocale } from "@/i18n/config";
import { resolveLocale } from "@/lib/i18n/locale";

async function loadMessages(locale: AppLocale) {
  const [
    common,
    nav,
    commandPalette,
    team,
    teamPage,
    subscription,
    status,
    auth,
    settings,
    portal,
    dashboard,
    creators,
    contracts,
    opportunities,
    schedule,
    messages,
    billing,
    sponsors,
    reports,
    ai,
    pages,
    coach,
    onboarding,
    founding,
    legal,
    errors,
    emails,
  ] = await Promise.all([
    import(`../../messages/${locale}/common.json`),
    import(`../../messages/${locale}/nav.json`),
    import(`../../messages/${locale}/commandPalette.json`),
    import(`../../messages/${locale}/team.json`),
    import(`../../messages/${locale}/team-page.json`),
    import(`../../messages/${locale}/subscription.json`),
    import(`../../messages/${locale}/status.json`),
    import(`../../messages/${locale}/auth.json`),
    import(`../../messages/${locale}/settings.json`),
    import(`../../messages/${locale}/portal.json`),
    import(`../../messages/${locale}/dashboard.json`),
    import(`../../messages/${locale}/creators.json`),
    import(`../../messages/${locale}/contracts.json`),
    import(`../../messages/${locale}/opportunities.json`),
    import(`../../messages/${locale}/schedule.json`),
    import(`../../messages/${locale}/messages.json`),
    import(`../../messages/${locale}/billing.json`),
    import(`../../messages/${locale}/sponsors.json`),
    import(`../../messages/${locale}/reports.json`),
    import(`../../messages/${locale}/ai.json`),
    import(`../../messages/${locale}/pages.json`),
    import(`../../messages/${locale}/coach.json`),
    import(`../../messages/${locale}/onboarding.json`),
    import(`../../messages/${locale}/founding.json`),
    import(`../../messages/${locale}/legal.json`),
    import(`../../messages/${locale}/errors.json`),
    import(`../../messages/${locale}/emails.json`),
  ]);

  return {
    ...common.default,
    nav: nav.default,
    commandPalette: commandPalette.default,
    team: team.default,
    teamPage: teamPage.default,
    subscription: subscription.default,
    status: status.default,
    auth: auth.default,
    settings: settings.default,
    portal: portal.default,
    dashboard: dashboard.default,
    creators: creators.default,
    contracts: contracts.default,
    opportunities: opportunities.default,
    schedule: schedule.default,
    messages: messages.default,
    billing: billing.default,
    sponsors: sponsors.default,
    reports: reports.default,
    ai: ai.default,
    pages: pages.default,
    coach: coach.default,
    onboarding: onboarding.default,
    founding: founding.default,
    legal: legal.default,
    errors: errors.default,
    emails: emails.default,
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
