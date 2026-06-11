"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import { platforms, type Creator, type Platform } from "@/lib/creators";
import { connectCreatorPlatformAccount } from "@/app/creators/revenue-actions";
import { hasAvailablePlatformOAuth } from "@/lib/platform-oauth/config";
import { isOAuthPlatform, type OAuthPlatformUi } from "@/lib/platform-oauth/types";
import { OAuthPlatformActions } from "./OAuthPlatformActions";

interface ConnectPlatformModalProps {
  open: boolean;
  onClose: () => void;
  creator: Creator;
  connectedPlatforms: Platform[];
  oauthPlatformUi?: OAuthPlatformUi[];
}

export function ConnectPlatformModal({
  open,
  onClose,
  creator,
  connectedPlatforms,
  oauthPlatformUi = [],
}: ConnectPlatformModalProps) {
  const router = useRouter();
  const [platform, setPlatform] = useState<Platform>("YouTube");
  const [handle, setHandle] = useState("");
  const [advertisement, setAdvertisement] = useState("");
  const [subscription, setSubscription] = useState("");
  const [donations, setDonations] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const availablePlatforms = platforms.filter(
    (p) => !connectedPlatforms.includes(p)
  );

  function reset() {
    setPlatform(availablePlatforms[0] ?? "YouTube");
    setHandle("");
    setAdvertisement("");
    setSubscription("");
    setDonations("");
    setError("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await connectCreatorPlatformAccount(
      creator.id,
      platform,
      handle,
      {
        advertisement: parseFloat(advertisement) || 0,
        subscription: parseFloat(subscription) || 0,
        donations: parseFloat(donations) || 0,
      }
    );

    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    handleClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-surface-raised shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Connect Platform</h2>
            <p className="text-xs text-gray-500">
              Link a social or streaming account for {creator.name}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {availablePlatforms.length === 0 ? (
          <div className="p-6 text-sm text-gray-400">
            All supported platforms are already connected for this creator.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200"
              >
                {availablePlatforms.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {isOAuthPlatform(platform) && (
                <div className="mt-3">
                  <OAuthPlatformActions
                    creatorId={creator.id}
                    platforms={oauthPlatformUi.filter(
                      (entry) => entry.platform === platform
                    )}
                    layout="stack"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Account handle
              </label>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@channel or username"
                required
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200"
              />
            </div>

            <div className="rounded-lg border border-border bg-surface/60 p-4">
              <p className="text-sm font-medium text-gray-300">
                This month&apos;s income (optional)
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {hasAvailablePlatformOAuth(oauthPlatformUi)
                  ? "Enter figures manually, or connect YouTube/Twitch above to sync automatically."
                  : "Enter figures manually until platform OAuth is configured."}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Ads</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={advertisement}
                    onChange={(e) => setAdvertisement(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    Subs
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={subscription}
                    onChange={(e) => setSubscription(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    Tips
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={donations}
                    onChange={(e) => setDonations(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg px-4 py-2 text-sm text-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Connect account
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
