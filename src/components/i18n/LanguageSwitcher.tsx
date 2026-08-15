"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { locales, type AppLocale } from "@/i18n/config";
import { setPreferredLocale } from "@/lib/i18n/actions";

const selectClassName =
  "rounded-xl border border-white/[0.08] bg-surface-raised/80 px-3 py-2.5 text-sm text-gray-200 backdrop-blur-sm focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "default" | "compact";
}

export function LanguageSwitcher({
  className,
  variant = "default",
}: LanguageSwitcherProps) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("language");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(nextLocale: string) {
    if (nextLocale === locale) return;

    startTransition(async () => {
      setError(null);
      const result = await setPreferredLocale(nextLocale);
      if (result.error) {
        setError(result.error);
        return;
      }
      window.location.reload();
    });
  }

  return (
    <div className={className}>
      {variant === "default" ? (
        <label
          htmlFor="language-switcher"
          className="block text-xs uppercase tracking-wide text-gray-500"
        >
          {t("label")}
        </label>
      ) : null}
      <select
        id="language-switcher"
        value={locale}
        onChange={(event) => handleChange(event.target.value)}
        disabled={isPending}
        aria-label={t("label")}
        className={`${selectClassName} ${variant === "default" ? "mt-2 w-full max-w-xs" : "w-auto"} ${isPending ? "opacity-60" : ""}`}
      >
        {locales.map((code) => (
          <option key={code} value={code}>
            {t(code)}
          </option>
        ))}
      </select>
      {error ? (
        <p className="mt-2 text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
