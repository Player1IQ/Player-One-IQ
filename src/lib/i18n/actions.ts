"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isAppLocale, LOCALE_COOKIE_NAME } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function setPreferredLocale(
  locale: string
): Promise<{ error?: string }> {
  if (!isAppLocale(locale)) {
    return { error: "Invalid locale." };
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });

  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase.from("user_profiles").upsert(
        {
          user_id: user.id,
          preferred_locale: locale,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (error) {
        return { error: error.message };
      }
    }
  }

  revalidatePath("/", "layout");
  return {};
}
