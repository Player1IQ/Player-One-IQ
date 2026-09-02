"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Bell, Loader2 } from "lucide-react";
import type { NotificationPreferences } from "@/lib/notifications/types";
import { saveMyNotificationPreferences } from "@/app/notifications/actions";

interface NotificationPreferencesFormProps {
  initial: NotificationPreferences;
  compact?: boolean;
  showOpportunityEmails?: boolean;
}

export function NotificationPreferencesForm({
  initial,
  compact = false,
  showOpportunityEmails = true,
}: NotificationPreferencesFormProps) {
  const t = useTranslations("settings.notifications");
  const [prefs, setPrefs] = useState(initial);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function update(key: keyof NotificationPreferences, value: boolean) {
    const previous = prefs;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setMessage("");
    setError("");
    startTransition(async () => {
      const result = await saveMyNotificationPreferences(next);
      if ("error" in result) {
        setPrefs(previous);
        setError(result.error);
        return;
      }
      setMessage(t("saved"));
    });
  }

  const toggles: Array<{
    key: keyof NotificationPreferences;
    label: string;
    description: string;
  }> = [
    {
      key: "emailDealDeadlines",
      label: t("dealDeadlines"),
      description: t("dealDeadlinesDescription"),
    },
    ...(showOpportunityEmails
      ? [
          {
            key: "emailNewOpportunities" as const,
            label: t("newOpportunities"),
            description: t("newOpportunitiesDescription"),
          },
        ]
      : []),
    {
      key: "emailNewMessages",
      label: t("newMessages"),
      description: t("newMessagesDescription"),
    },
  ];

  return (
    <section
      id="notifications"
      className={
        compact
          ? "space-y-4"
          : "rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-6 backdrop-blur-sm"
      }
    >
      <div className="flex items-start gap-3">
        {!compact ? (
          <Bell className="mt-0.5 h-5 w-5 text-accent-light" />
        ) : null}
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-white">{t("title")}</h2>
          <p className="mt-1 text-sm text-gray-500">{t("description")}</p>
        </div>
      </div>

      <ul className="mt-5 space-y-4">
        {toggles.map((item) => (
          <li
            key={item.key}
            className="flex items-start justify-between gap-4 rounded-xl border border-white/[0.06] bg-surface px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-white">{item.label}</p>
              <p className="mt-1 text-xs text-gray-500">{item.description}</p>
            </div>
            <label className="inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border bg-surface-raised text-accent"
                checked={prefs[item.key]}
                disabled={isPending}
                onChange={(event) => update(item.key, event.target.checked)}
              />
              <span className="sr-only">{item.label}</span>
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex min-h-[1.25rem] items-center gap-2 text-sm">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin text-gray-500" /> : null}
        {message ? <p className="text-emerald-400">{message}</p> : null}
        {error ? <p className="text-red-400">{error}</p> : null}
      </div>
    </section>
  );
}
