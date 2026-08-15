import { cookies, headers } from "next/headers";
import {
  defaultLocale,
  isAppLocale,
  LOCALE_COOKIE_NAME,
  type AppLocale,
} from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

function parseAcceptLanguage(header: string | null): AppLocale | null {
  if (!header) return null;

  const candidates = header
    .split(",")
    .map((part) => {
      const [lang, qPart] = part.trim().split(";");
      const q = qPart?.startsWith("q=") ? Number.parseFloat(qPart.slice(2)) : 1;
      return { lang: lang.trim().toLowerCase(), q };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of candidates) {
    if (isAppLocale(lang)) return lang;

    const prefix = lang.split("-")[0];
    if (isAppLocale(prefix)) return prefix;
  }

  return null;
}

/**
 * Locale resolution order:
 * 1. Logged-in user `user_profiles.preferred_locale`
 * 2. Cookie `NEXT_LOCALE`
 * 3. Accept-Language header
 * 4. Default (`en`)
 */
export async function resolveLocale(): Promise<AppLocale> {
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from("user_profiles")
        .select("preferred_locale")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.preferred_locale && isAppLocale(data.preferred_locale)) {
        return data.preferred_locale;
      }
    }
  }

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  if (cookieLocale && isAppLocale(cookieLocale)) {
    return cookieLocale;
  }

  const headerList = await headers();
  const acceptLanguageLocale = parseAcceptLanguage(
    headerList.get("accept-language")
  );
  if (acceptLanguageLocale) {
    return acceptLanguageLocale;
  }

  return defaultLocale;
}
