"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { BarChart2, Clock, Link2, Sparkles, TrendingUp, Users } from "lucide-react";
import { OAuthPlatformActions } from "@/components/creators/OAuthPlatformActions";
import { formatPlatformOAuthError } from "@/lib/platform-oauth/oauth-errors";
import { trackMarketingEvent } from "@/lib/marketing/analytics";
import type { CreatorSnapshotView } from "@/lib/portal/snapshot";

function formatCount(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US").format(value);
}

function formatWow(value: number | null, hidden: boolean): string | null {
  if (hidden || value == null) return null;
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}%`;
}

export function CreatorSnapshotClient({
  snapshot,
  creatorId,
  oauthSuccess,
  oauthError,
}: {
  snapshot: CreatorSnapshotView;
  creatorId: string;
  oauthSuccess?: string | null;
  oauthError?: string | null;
}) {
  const t = useTranslations("portal.snapshot");
  const oauthErrorView = oauthError
    ? formatPlatformOAuthError(oauthError, oauthSuccess)
    : null;

  useEffect(() => {
    trackMarketingEvent("snapshot_viewed");
    trackMarketingEvent("plan_generated");
    if (oauthSuccess) {
      trackMarketingEvent("connect_completed", { platform: oauthSuccess });
    }
  }, [oauthSuccess]);

  const hideWow = snapshot.historyPointCount < 2;
  const audienceWow = formatWow(snapshot.audienceWowPercent, hideWow);
  const viewsWow = formatWow(snapshot.viewsWowPercent, hideWow);

  return (
    <div className="space-y-6">
      {oauthSuccess ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {t("oauthConnected", { platform: oauthSuccess })}
        </div>
      ) : null}
      {oauthErrorView ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <p className="font-medium">{oauthErrorView.title}</p>
          <p className="mt-1 text-red-300/80">{oauthErrorView.message}</p>
        </div>
      ) : null}

      <section className="rounded-2xl border border-accent/20 bg-accent/5 px-5 py-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-200">
          <Link2 className="h-4 w-4 text-accent-light" />
          {snapshot.connected
            ? t("connectedHeading")
            : t("connectHeading")}
        </div>
        <p className="mb-4 text-sm text-gray-400">
          {snapshot.connected ? t("connectedBody") : t("connectBody")}
        </p>
        <OAuthPlatformActions
          creatorId={creatorId}
          platforms={snapshot.oauthPlatformUi}
          layout="stack"
          returnTo="/portal/snapshot"
        />
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <Users className="h-3.5 w-3.5" />
            {t("audienceLabel")}
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-white">
            {formatCount(snapshot.audienceSize)}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            {audienceWow
              ? t("wowSinceLastCapture", { percent: audienceWow })
              : t("wowHidden")}
          </p>
        </article>
        <article className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <BarChart2 className="h-3.5 w-3.5" />
            {t("recentViewsLabel")}
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-white">
            {snapshot.connected ? formatCount(snapshot.recentViews) : "—"}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            {viewsWow
              ? t("wowSinceLastCapture", { percent: viewsWow })
              : t("wowHidden")}
          </p>
        </article>
      </div>

      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-5">
        <h2 className="text-sm font-semibold text-white">{t("recentTitle")}</h2>
        {snapshot.recentContent.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">{t("recentEmpty")}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {snapshot.recentContent.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <div>
                  <p className="text-gray-200">{item.title}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {item.platform}
                    {item.publishedAt
                      ? ` · ${new Date(item.publishedAt).toLocaleDateString()}`
                      : ""}
                  </p>
                </div>
                <span className="shrink-0 font-data text-xs text-gray-400">
                  {formatCount(item.views)} {t("views")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <TrendingUp className="h-4 w-4 text-accent-light" />
            {t("bestDaysTitle")}
          </div>
          {snapshot.cadenceInferred ? (
            <p className="mt-3 text-sm text-gray-300">
              {snapshot.typicalDays.join(", ")}
            </p>
          ) : (
            <p className="mt-3 text-sm text-gray-400">{t("bestDaysEmpty")}</p>
          )}
        </section>
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Clock className="h-4 w-4 text-accent-light" />
            {t("bestTimesTitle")}
          </div>
          {snapshot.streamTimesInferred && snapshot.streamTimesLabel ? (
            <p className="mt-3 text-sm text-gray-300">
              {snapshot.streamTimesLabel}
            </p>
          ) : (
            <p className="mt-3 text-sm text-gray-400">{t("bestTimesEmpty")}</p>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <Sparkles className="h-4 w-4 text-accent-light" />
          {t("insightsTitle")}
        </div>
        <ol className="space-y-4">
          {snapshot.insights.map((insight, index) => (
            <li key={insight.title}>
              <p className="text-sm font-medium text-gray-200">
                {index + 1}. {insight.title}
              </p>
              <p className="mt-1 text-sm text-gray-400">{insight.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-5">
        <h2 className="text-sm font-semibold text-white">{t("planTitle")}</h2>
        <p className="mt-1 text-xs text-gray-500">{t("planSubtitle")}</p>
        <ol className="mt-4 space-y-4">
          {snapshot.firstWeekPlan.map((item, index) => (
            <li key={item.title}>
              <p className="text-sm font-medium text-gray-200">
                {index + 1}. {item.title}
              </p>
              <p className="mt-1 text-sm text-gray-400">{item.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <p className="text-center text-sm text-gray-500">
        <Link href="/portal/growth" className="text-accent-light hover:text-white">
          {t("openGrowth")}
        </Link>
      </p>
    </div>
  );
}
