"use client";

import { formatPlatformOAuthError } from "@/lib/platform-oauth/oauth-errors";

interface CreatorOAuthBannerProps {
  success?: string | null;
  error?: string | null;
}

export function CreatorOAuthBanner({ success, error }: CreatorOAuthBannerProps) {
  if (!success && !error) return null;

  if (success) {
    const twitchNote =
      success === "Twitch"
        ? " Subscription revenue is an estimate based on current sub count."
        : "";
    return (
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
        {success} account connected and income synced for this month.{twitchNote}
      </div>
    );
  }

  const formatted = formatPlatformOAuthError(error ?? "", null);

  return (
    <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      <p className="font-medium text-red-200">{formatted.title}</p>
      <p className="mt-1">{formatted.message}</p>
      {formatted.adminHint ? (
        <p className="mt-2 text-xs text-red-300/80">{formatted.adminHint}</p>
      ) : null}
    </div>
  );
}
