"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Loader2, Pencil, Plus, RefreshCw, Unlink } from "lucide-react";
import type { OAuthPlatformUi } from "@/lib/platform-oauth/config";
import { OAuthPlatformActions } from "./OAuthPlatformActions";
import type { Creator } from "@/lib/creators";
import {
  connectionStatusLabel,
  isConnectedPlatformAccount,
  isIncompleteOAuthPlatformAccount,
  type CreatorPlatformAccount,
  type CreatorRevenueEntry,
} from "@/lib/creator-revenue";
import {
  cancelCreatorPlatformOAuthAttempt,
  disconnectCreatorPlatformAccount,
  syncAllCreatorOAuthAccounts,
  syncCreatorPlatformAccount,
  upsertCreatorPlatformRevenue,
} from "@/app/creators/revenue-actions";
import { getPlatformOAuthStartUrl } from "@/lib/platform-oauth/start-url";
import { isOAuthPlatform } from "@/lib/platform-oauth/types";
import { PlatformBadge } from "./PlatformBadge";
import { ConnectPlatformModal } from "./ConnectPlatformModal";

interface CreatorPlatformAccountsProps {
  creator: Creator;
  accounts: CreatorPlatformAccount[];
  revenueEntries: CreatorRevenueEntry[];
  oauthPlatformUi?: OAuthPlatformUi[];
  canWrite?: boolean;
  allowPlatformOAuth?: boolean;
}

function getAccountRevenue(
  accountId: string,
  entries: CreatorRevenueEntry[]
) {
  const accountEntries = entries.filter(
    (entry) => entry.platformAccountId === accountId
  );
  return {
    advertisement:
      accountEntries.find((e) => e.revenueType === "advertisement")?.amount ??
      0,
    subscription:
      accountEntries.find((e) => e.revenueType === "subscription")?.amount ?? 0,
    donations:
      accountEntries.find((e) => e.revenueType === "donations")?.amount ?? 0,
    other:
      accountEntries.find((e) => e.revenueType === "other")?.amount ?? 0,
  };
}

export function CreatorPlatformAccounts({
  creator,
  accounts,
  revenueEntries,
  oauthPlatformUi = [],
  canWrite = true,
  allowPlatformOAuth = false,
}: CreatorPlatformAccountsProps) {
  const canManagePlatforms = canWrite || allowPlatformOAuth;
  const router = useRouter();
  const [connectOpen, setConnectOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ advertisement: "", subscription: "", donations: "" });
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function startEdit(account: CreatorPlatformAccount) {
    const revenue = getAccountRevenue(account.id, revenueEntries);
    setEditingId(account.id);
    setForm({
      advertisement: revenue.advertisement ? String(revenue.advertisement) : "",
      subscription: revenue.subscription ? String(revenue.subscription) : "",
      donations: revenue.donations ? String(revenue.donations) : "",
    });
    setError("");
  }

  async function saveRevenue(accountId: string) {
    setLoadingId(accountId);
    setError("");

    const result = await upsertCreatorPlatformRevenue(accountId, {
      advertisement: parseFloat(form.advertisement) || 0,
      subscription: parseFloat(form.subscription) || 0,
      donations: parseFloat(form.donations) || 0,
    });

    setLoadingId(null);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }

    setEditingId(null);
    router.refresh();
  }

  const oauthAccountCount = accounts.filter(
    (account) => account.connectionStatus === "connected_oauth"
  ).length;

  async function handleSyncAll() {
    setLoadingId("all");
    setError("");

    const result = await syncAllCreatorOAuthAccounts(creator.id);
    setLoadingId(null);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  async function handleSync(accountId: string) {
    setLoadingId(accountId);
    setError("");

    const result = await syncCreatorPlatformAccount(accountId);
    setLoadingId(null);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  async function handleDisconnect(accountId: string) {
    if (!confirm("Disconnect this platform account?")) return;
    setLoadingId(accountId);
    const result = await disconnectCreatorPlatformAccount(accountId);
    setLoadingId(null);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleCancelOAuthAttempt(accountId: string) {
    if (!confirm("Cancel this platform connection attempt?")) return;
    setLoadingId(accountId);
    const result = await cancelCreatorPlatformOAuthAttempt(accountId);
    setLoadingId(null);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <>
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {accounts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-subtle py-10 text-center">
            <p className="text-sm text-gray-500">
              No platform accounts connected yet.
            </p>
            {canManagePlatforms && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {canWrite ? (
                  <button
                    onClick={() => setConnectOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
                  >
                    <Plus className="h-4 w-4" />
                    Connect manually
                  </button>
                ) : null}
                <OAuthPlatformActions
                  creatorId={creator.id}
                  platforms={oauthPlatformUi}
                />
              </div>
            )}
          </div>
        ) : (
          <>
            {canManagePlatforms && oauthAccountCount > 1 ? (
              <div className="flex justify-end">
                <button
                  onClick={handleSyncAll}
                  disabled={loadingId === "all"}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs text-gray-300 hover:text-white"
                >
                  {loadingId === "all" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Sync all OAuth accounts
                </button>
              </div>
            ) : null}
            <ul className="space-y-3">
              {accounts.map((account) => {
                const revenue = getAccountRevenue(account.id, revenueEntries);
                const isEditing = editingId === account.id;
                const isIncompleteOAuth = isIncompleteOAuthPlatformAccount(account);
                const oauthRetryUrl =
                  allowPlatformOAuth &&
                  isIncompleteOAuth &&
                  isOAuthPlatform(account.platform)
                    ? getPlatformOAuthStartUrl(
                        account.platform,
                        creator.id,
                        `/creators/${creator.id}`
                      )
                    : null;

                return (
                  <li
                    key={account.id}
                    className="rounded-lg border border-border-subtle bg-surface p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <PlatformBadge platform={account.platform} />
                        <div>
                          <p className="font-medium text-gray-100">
                            {account.accountHandle === "authorizing" ||
                            account.accountHandle === "connected"
                              ? account.platform
                              : account.accountHandle}
                          </p>
                          <p
                            className={`text-xs ${
                              isIncompleteOAuth
                                ? "text-amber-400"
                                : "text-gray-500"
                            }`}
                          >
                            {connectionStatusLabel(account.connectionStatus)}
                          </p>
                          {account.syncError && (
                            <p className="mt-1 text-xs text-red-400">
                              {account.syncError}
                            </p>
                          )}
                          {account.lastSyncedAt && (
                            <p className="mt-1 text-xs text-gray-600">
                              Last synced{" "}
                              {new Date(account.lastSyncedAt).toLocaleString()}
                            </p>
                          )}
                          {account.platform === "Twitch" &&
                          account.connectionStatus === "connected_oauth" ? (
                            <p className="mt-1 text-xs text-gray-600">
                              Sub revenue is estimated from active subscriptions.
                            </p>
                          ) : null}
                        </div>
                      </div>
                      {canManagePlatforms ? (
                        <div className="flex flex-wrap gap-2">
                          {oauthRetryUrl ? (
                            <a
                              href={oauthRetryUrl}
                              className="inline-flex items-center gap-1 rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1.5 text-xs text-accent-light hover:text-white"
                            >
                              <Link2 className="h-3.5 w-3.5" />
                              Retry connect
                            </a>
                          ) : null}
                          {account.connectionStatus === "connected_oauth" && (
                            <button
                              onClick={() => handleSync(account.id)}
                              disabled={loadingId === account.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-gray-300 hover:text-white"
                            >
                              {loadingId === account.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3.5 w-3.5" />
                              )}
                              Sync now
                            </button>
                          )}
                          {canWrite ? (
                            <>
                              <button
                                onClick={() =>
                                  isEditing
                                    ? setEditingId(null)
                                    : startEdit(account)
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-gray-300 hover:text-white"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                {isEditing ? "Cancel" : "Update income"}
                              </button>
                              <button
                                onClick={() => handleDisconnect(account.id)}
                                disabled={loadingId === account.id}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 px-2.5 py-1.5 text-xs text-red-400"
                              >
                                {loadingId === account.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Unlink className="h-3.5 w-3.5" />
                                )}
                                Disconnect
                              </button>
                            </>
                          ) : allowPlatformOAuth &&
                            isIncompleteOAuth ? (
                            <button
                              onClick={() => handleCancelOAuthAttempt(account.id)}
                              disabled={loadingId === account.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 px-2.5 py-1.5 text-xs text-red-400"
                            >
                              {loadingId === account.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Unlink className="h-3.5 w-3.5" />
                              )}
                              Cancel
                            </button>
                          ) : allowPlatformOAuth &&
                            account.connectionStatus === "connected_oauth" ? (
                            <button
                              onClick={() => handleDisconnect(account.id)}
                              disabled={loadingId === account.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 px-2.5 py-1.5 text-xs text-red-400"
                            >
                              {loadingId === account.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Unlink className="h-3.5 w-3.5" />
                              )}
                              Disconnect
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    {isEditing ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        {(["advertisement", "subscription", "donations"] as const).map(
                          (key) => (
                            <div key={key}>
                              <label className="mb-1 block text-xs capitalize text-gray-500">
                                {key}
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={form[key]}
                                onChange={(e) =>
                                  setForm({ ...form, [key]: e.target.value })
                                }
                                className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-gray-200"
                              />
                            </div>
                          )
                        )}
                        <div className="sm:col-span-3 flex justify-end">
                          <button
                            onClick={() => saveRevenue(account.id)}
                            disabled={loadingId === account.id}
                            className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-sm text-white"
                          >
                            {loadingId === account.id && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            Save this month
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 flex flex-wrap gap-4 text-sm">
                        <span className="text-gray-400">
                          Ads:{" "}
                          <span className="text-gray-200">
                            ${revenue.advertisement.toLocaleString()}
                          </span>
                        </span>
                        <span className="text-gray-400">
                          Subs:{" "}
                          <span className="text-gray-200">
                            ${revenue.subscription.toLocaleString()}
                          </span>
                        </span>
                        <span className="text-gray-400">
                          Tips:{" "}
                          <span className="text-gray-200">
                            ${revenue.donations.toLocaleString()}
                          </span>
                        </span>
                        {revenue.other > 0 ? (
                          <span className="text-gray-400">
                            Other:{" "}
                            <span className="text-gray-200">
                              ${revenue.other.toLocaleString()}
                            </span>
                          </span>
                        ) : null}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {canManagePlatforms && allowPlatformOAuth ? (
              <OAuthPlatformActions
                creatorId={creator.id}
                platforms={oauthPlatformUi.filter(
                  (entry) =>
                    entry.status === "available" &&
                    !accounts.some(
                      (account) =>
                        account.platform === entry.platform &&
                        (isConnectedPlatformAccount(account) ||
                          isIncompleteOAuthPlatformAccount(account))
                    )
                )}
                returnTo={`/creators/${creator.id}`}
              />
            ) : null}

            {canWrite && accounts.length < 5 ? (
              <button
                onClick={() => setConnectOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-gray-300 hover:border-accent/30 hover:text-white"
              >
                <Link2 className="h-4 w-4" />
                Connect another platform
              </button>
            ) : null}
          </>
        )}
      </div>

      <ConnectPlatformModal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        creator={creator}
        connectedPlatforms={accounts
          .filter(isConnectedPlatformAccount)
          .map((account) => account.platform)}
        oauthPlatformUi={oauthPlatformUi}
      />
    </>
  );
}
