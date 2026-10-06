"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { refreshCreatorAudienceAction } from "@/lib/platform-oauth/refresh-actions";
import {
  formatAnalyticsUpdatedLabel,
  type PlatformAnalyticsStatus,
} from "@/lib/platform-oauth/content-cache";

const BACKGROUND_REFRESH_MS = 15 * 60 * 1000;

interface PlatformAnalyticsToolbarProps {
  creatorId: string;
  updatedAt: string | null;
  platforms: PlatformAnalyticsStatus[];
  profileHref?: string;
}

export function PlatformAnalyticsToolbar({
  creatorId,
  updatedAt,
  platforms,
  profileHref,
}: PlatformAnalyticsToolbarProps) {
  const t = useTranslations("portal.growth");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [label, setLabel] = useState(formatAnalyticsUpdatedLabel(updatedAt));
  const didBackgroundRefresh = useRef(false);
  const reconnect = platforms.filter((platform) => platform.needsReconnect);
  const canRefresh = platforms.some((platform) => platform.connectedViaOAuth);

  useEffect(() => {
    setLabel(formatAnalyticsUpdatedLabel(updatedAt));
  }, [updatedAt]);

  useEffect(() => {
    if (didBackgroundRefresh.current || !canRefresh) return;
    if (updatedAt) {
      const age = Date.now() - new Date(updatedAt).getTime();
      if (Number.isFinite(age) && age < BACKGROUND_REFRESH_MS) return;
    }
    didBackgroundRefresh.current = true;
    startTransition(async () => {
      const result = await refreshCreatorAudienceAction(creatorId);
      if (result.ok) {
        setLabel(formatAnalyticsUpdatedLabel(result.updatedAt));
        router.refresh();
      }
    });
  }, [canRefresh, creatorId, router, updatedAt]);

  async function handleRefresh() {
    startTransition(async () => {
      const result = await refreshCreatorAudienceAction(creatorId);
      if (result.ok) {
        setLabel(formatAnalyticsUpdatedLabel(result.updatedAt));
        router.refresh();
      }
    });
  }

  if (!canRefresh && reconnect.length === 0 && !label) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <p className="text-sm text-gray-400">
          {label ?? t("updatedUnknown")}
        </p>
        {canRefresh ? (
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-gray-200 hover:border-accent/40 hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`}
            />
            {t("refresh")}
          </button>
        ) : null}
      </div>
      {reconnect.length > 0 ? (
        <ul className="space-y-2">
          {reconnect.map((platform) => (
            <li
              key={platform.platform}
              className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <div>
                <p className="font-medium">
                  {t("reconnectTitle", { platform: platform.platform })}
                </p>
                <p className="mt-0.5 text-amber-100/80">
                  {platform.reconnectReason}
                  {profileHref ? (
                    <>
                      {" "}
                      <a
                        href={profileHref}
                        className="font-medium text-white underline-offset-2 hover:underline"
                      >
                        {t("openProfile")}
                      </a>
                    </>
                  ) : null}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
