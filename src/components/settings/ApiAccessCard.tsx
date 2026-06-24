"use client";

import { useState, useTransition } from "react";
import { KeyRound, Loader2, Trash2 } from "lucide-react";
import {
  createApiKeyAction,
  revokeApiKeyAction,
} from "@/app/settings/api-key-actions";
import type { OrganizationApiKeySummary } from "@/lib/api/key-management";

interface ApiAccessCardProps {
  apiKeys: OrganizationApiKeySummary[];
  appUrl: string;
  canManage: boolean;
}

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ApiAccessCard({
  apiKeys: initialKeys,
  appUrl,
  canManage,
}: ApiAccessCardProps) {
  const [keys, setKeys] = useState(initialKeys);
  const [name, setName] = useState("");
  const [newFullKey, setNewFullKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const baseUrl = appUrl.replace(/\/$/, "");

  function handleCreate() {
    setMessage("");
    setError("");
    setNewFullKey(null);
    startTransition(async () => {
      const result = await createApiKeyAction({ name });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.key) {
        setKeys((current) => [result.key!, ...current]);
      }
      if (result.fullKey) {
        setNewFullKey(result.fullKey);
      }
      setName("");
      setMessage("API key created. Copy it now — it will not be shown again.");
    });
  }

  function handleRevoke(keyId: string) {
    setMessage("");
    setError("");
    startTransition(async () => {
      const result = await revokeApiKeyAction(keyId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setKeys((current) => current.filter((key) => key.id !== keyId));
      setMessage("API key revoked.");
    });
  }

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-6 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <KeyRound className="mt-0.5 h-5 w-5 text-accent-light" />
        <div className="flex-1">
          <h2 className="text-base font-semibold text-white">API access</h2>
          <p className="mt-1 text-sm text-gray-500">
            Create API keys to read creators, contracts, sponsors, and campaigns
            from your Agency Pro workspace.
          </p>

          <div className="mt-4 rounded-xl border border-white/[0.06] bg-surface px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Quick start
            </p>
            <p className="mt-2 text-sm text-gray-400">
              Send your key as a Bearer token or{" "}
              <code className="rounded bg-white/5 px-1 py-0.5 text-xs text-gray-300">
                Authorization: ApiKey &lt;key&gt;
              </code>
              .
            </p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-black/30 p-3 text-xs text-gray-300">
{`curl -H "Authorization: Bearer poiq_your_key" \\
  ${baseUrl}/api/v1/creators`}
            </pre>
            <div className="mt-3 space-y-1 text-sm text-gray-400">
              <p>
                <span className="font-medium text-gray-300">GET</span>{" "}
                <code className="text-xs text-accent-light">/api/v1/creators</code>{" "}
                — list creators
              </p>
              <p>
                <span className="font-medium text-gray-300">GET</span>{" "}
                <code className="text-xs text-accent-light">/api/v1/creators/:id</code>{" "}
                — creator detail
              </p>
              <p>
                <span className="font-medium text-gray-300">GET</span>{" "}
                <code className="text-xs text-accent-light">/api/v1/contracts</code>{" "}
                — list contracts
              </p>
              <p>
                <span className="font-medium text-gray-300">GET</span>{" "}
                <code className="text-xs text-accent-light">/api/v1/sponsors</code>{" "}
                — list sponsors
              </p>
              <p>
                <span className="font-medium text-gray-300">GET</span>{" "}
                <code className="text-xs text-accent-light">/api/v1/campaigns</code>{" "}
                — list sponsor campaigns
              </p>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Responses use{" "}
              <code className="rounded bg-white/5 px-1 py-0.5">
                {"{ data, meta: { organization_id } }"}
              </code>
              . Errors return{" "}
              <code className="rounded bg-white/5 px-1 py-0.5">
                {"{ error, code }"}
              </code>
              .
            </p>
          </div>

          {canManage ? (
            <div className="mt-6 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Key label (e.g. Production CRM)"
                  className="flex-1 rounded-lg border border-white/[0.08] bg-surface px-3 py-2 text-sm text-white placeholder:text-gray-600"
                  disabled={isPending}
                />
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={isPending || !name.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Create key
                </button>
              </div>

              {newFullKey ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <p className="text-sm font-medium text-amber-200">
                    Copy your new API key now
                  </p>
                  <p className="mt-1 text-xs text-amber-100/80">
                    This is the only time the full key is shown.
                  </p>
                  <code className="mt-3 block overflow-x-auto rounded-lg bg-black/30 p-3 text-xs text-white">
                    {newFullKey}
                  </code>
                </div>
              ) : null}

              {keys.length > 0 ? (
                <div className="space-y-2">
                  {keys.map((key) => (
                    <div
                      key={key.id}
                      className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{key.name}</p>
                        <p className="mt-1 font-mono text-xs text-gray-500">
                          {key.keyPrefix}…
                        </p>
                        <p className="mt-1 text-xs text-gray-600">
                          Created {formatDate(key.createdAt)}
                          {key.lastUsedAt
                            ? ` · Last used ${formatDate(key.lastUsedAt)}`
                            : " · Never used"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRevoke(key.id)}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 self-start rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50 sm:self-center"
                      >
                        <Trash2 className="h-4 w-4" />
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No active API keys yet.</p>
              )}
            </div>
          ) : null}

          {message ? (
            <p className="mt-4 text-sm text-emerald-400">{message}</p>
          ) : null}
          {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}
