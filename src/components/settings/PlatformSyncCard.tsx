"use client";

import { useState, useTransition } from "react";
import { Loader2, RefreshCw, Youtube } from "lucide-react";
import { syncOrganizationPlatformRevenue } from "@/app/settings/platform-sync-actions";

interface PlatformSyncCardProps {
  oauthEnabled: boolean;
  connectedCount: number;
  canManage: boolean;
}

export function PlatformSyncCard({
  oauthEnabled,
  connectedCount,
  canManage,
}: PlatformSyncCardProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSync() {
    setMessage("");
    setError("");
    startTransition(async () => {
      const result = await syncOrganizationPlatformRevenue();
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      if ("synced" in result) {
        setMessage(
          `Synced ${result.synced} account${result.synced === 1 ? "" : "s"}${
            result.failed > 0 ? ` (${result.failed} failed)` : ""
          }.`
        );
      }
    });
  }

  return (
    <section className="rounded-xl border border-border bg-surface-raised p-6">
      <div className="flex items-start gap-3">
        <Youtube className="mt-0.5 h-5 w-5 text-accent-light" />
        <div className="flex-1">
          <h2 className="text-base font-semibold text-white">
            Platform revenue sync
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {oauthEnabled
              ? `${connectedCount} OAuth-connected account${
                  connectedCount === 1 ? "" : "s"
                } in this workspace. YouTube and Twitch sync daily on Vercel (6:00 UTC).`
              : "Platform OAuth is disabled. Add YouTube and Twitch credentials to enable automatic sync."}
          </p>

          {canManage && oauthEnabled && connectedCount > 0 ? (
            <button
              type="button"
              onClick={handleSync}
              disabled={isPending}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-gray-200 hover:border-accent/30 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sync all now
            </button>
          ) : null}

          {message ? (
            <p className="mt-3 text-sm text-emerald-400">{message}</p>
          ) : null}
          {error ? (
            <p className="mt-3 text-sm text-red-400">{error}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
