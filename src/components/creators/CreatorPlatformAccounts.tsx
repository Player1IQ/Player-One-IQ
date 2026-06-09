"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Loader2, Pencil, Plus, Unlink } from "lucide-react";
import type { Creator } from "@/lib/creators";
import {
  connectionStatusLabel,
  type CreatorPlatformAccount,
  type CreatorRevenueEntry,
} from "@/lib/creator-revenue";
import {
  disconnectCreatorPlatformAccount,
  upsertCreatorPlatformRevenue,
} from "@/app/creators/revenue-actions";
import { PlatformBadge } from "./PlatformBadge";
import { ConnectPlatformModal } from "./ConnectPlatformModal";

interface CreatorPlatformAccountsProps {
  creator: Creator;
  accounts: CreatorPlatformAccount[];
  revenueEntries: CreatorRevenueEntry[];
  canWrite?: boolean;
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
  };
}

export function CreatorPlatformAccounts({
  creator,
  accounts,
  revenueEntries,
  canWrite = true,
}: CreatorPlatformAccountsProps) {
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
            {canWrite && (
              <button
                onClick={() => setConnectOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
              >
                <Plus className="h-4 w-4" />
                Connect platform
              </button>
            )}
          </div>
        ) : (
          <>
            <ul className="space-y-3">
              {accounts.map((account) => {
                const revenue = getAccountRevenue(account.id, revenueEntries);
                const isEditing = editingId === account.id;

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
                            {account.accountHandle}
                          </p>
                          <p className="text-xs text-gray-500">
                            {connectionStatusLabel(account.connectionStatus)}
                          </p>
                        </div>
                      </div>
                      {canWrite && (
                        <div className="flex gap-2">
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
                        </div>
                      )}
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
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {canWrite && accounts.length < 5 && (
              <button
                onClick={() => setConnectOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-gray-300 hover:border-accent/30 hover:text-white"
              >
                <Link2 className="h-4 w-4" />
                Connect another platform
              </button>
            )}
          </>
        )}
      </div>

      <ConnectPlatformModal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        creator={creator}
        connectedPlatforms={accounts.map((account) => account.platform)}
      />
    </>
  );
}
