"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2, Webhook } from "lucide-react";
import {
  createWebhookAction,
  deleteWebhookAction,
  setWebhookActiveAction,
} from "@/app/settings/webhook-actions";
import type { OrganizationWebhookSummary } from "@/lib/api/webhook-management";
import { WEBHOOK_EVENTS, WEBHOOK_EVENT_LABELS } from "@/lib/api/webhook-events";

interface WebhookEndpointsCardProps {
  webhooks: OrganizationWebhookSummary[];
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

export function WebhookEndpointsCard({
  webhooks: initialWebhooks,
  canManage,
}: WebhookEndpointsCardProps) {
  const [webhooks, setWebhooks] = useState(initialWebhooks);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    ...WEBHOOK_EVENTS,
  ]);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function toggleEvent(event: string) {
    setSelectedEvents((current) =>
      current.includes(event)
        ? current.filter((value) => value !== event)
        : [...current, event]
    );
  }

  function handleCreate() {
    setMessage("");
    setError("");
    setNewSecret(null);
    startTransition(async () => {
      const result = await createWebhookAction({
        label,
        url,
        events: selectedEvents,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.webhook) {
        setWebhooks((current) => [result.webhook!, ...current]);
      }
      if (result.secret) {
        setNewSecret(result.secret);
      }
      setLabel("");
      setUrl("");
      setMessage(
        "Webhook endpoint created. Copy the signing secret now — it will not be shown again."
      );
    });
  }

  function handleToggleActive(webhookId: string, active: boolean) {
    setMessage("");
    setError("");
    startTransition(async () => {
      const result = await setWebhookActiveAction(webhookId, active);
      if (result.error) {
        setError(result.error);
        return;
      }
      setWebhooks((current) =>
        current.map((webhook) =>
          webhook.id === webhookId ? { ...webhook, active } : webhook
        )
      );
      setMessage(active ? "Webhook endpoint enabled." : "Webhook endpoint disabled.");
    });
  }

  function handleDelete(webhookId: string) {
    setMessage("");
    setError("");
    startTransition(async () => {
      const result = await deleteWebhookAction(webhookId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setWebhooks((current) => current.filter((webhook) => webhook.id !== webhookId));
      setMessage("Webhook endpoint deleted.");
    });
  }

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-6 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <Webhook className="mt-0.5 h-5 w-5 text-accent-light" />
        <div className="flex-1">
          <h2 className="text-base font-semibold text-white">Webhook endpoints</h2>
          <p className="mt-1 text-sm text-gray-500">
            Receive signed POST requests when workspace events occur. Verify
            payloads with the{" "}
            <code className="rounded bg-white/5 px-1 py-0.5 text-xs text-gray-300">
              X-POIQ-Signature
            </code>{" "}
            header (HMAC-SHA256).
          </p>

          <div className="mt-4 rounded-xl border border-white/[0.06] bg-surface px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Event envelope
            </p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-black/30 p-3 text-xs text-gray-300">
{`{
  "event": "application.created",
  "created_at": "2026-06-24T12:00:00.000Z",
  "organization_id": "...",
  "data": { ... }
}`}
            </pre>
          </div>

          {canManage ? (
            <div className="mt-6 space-y-4">
              <div className="space-y-3">
                <input
                  type="text"
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  placeholder="Label (e.g. Zapier production)"
                  className="w-full rounded-lg border border-white/[0.08] bg-surface px-3 py-2 text-sm text-white placeholder:text-gray-600"
                  disabled={isPending}
                />
                <input
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://webhook.site/your-unique-id"
                  className="w-full rounded-lg border border-white/[0.08] bg-surface px-3 py-2 text-sm text-white placeholder:text-gray-600"
                  disabled={isPending}
                />
                <fieldset className="space-y-2">
                  <legend className="text-sm text-gray-400">Events</legend>
                  <div className="flex flex-wrap gap-3">
                    {WEBHOOK_EVENTS.map((event) => (
                      <label
                        key={event}
                        className="inline-flex items-center gap-2 text-sm text-gray-300"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEvents.includes(event)}
                          onChange={() => toggleEvent(event)}
                          disabled={isPending}
                          className="rounded border-white/20 bg-surface"
                        />
                        {WEBHOOK_EVENT_LABELS[event]}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={
                    isPending ||
                    !label.trim() ||
                    !url.trim() ||
                    selectedEvents.length === 0
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Add endpoint
                </button>
              </div>

              {newSecret ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <p className="text-sm font-medium text-amber-200">
                    Copy your signing secret now
                  </p>
                  <p className="mt-1 text-xs text-amber-100/80">
                    Use this to verify{" "}
                    <code className="rounded bg-black/20 px-1">X-POIQ-Signature</code>
                    . It will not be shown again.
                  </p>
                  <code className="mt-3 block overflow-x-auto rounded-lg bg-black/30 p-3 text-xs text-white">
                    {newSecret}
                  </code>
                </div>
              ) : null}

              {webhooks.length > 0 ? (
                <div className="space-y-2">
                  {webhooks.map((webhook) => (
                    <div
                      key={webhook.id}
                      className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-surface px-4 py-3"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-white">
                              {webhook.label}
                            </p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs ${
                                webhook.active
                                  ? "bg-emerald-500/15 text-emerald-300"
                                  : "bg-gray-500/15 text-gray-400"
                              }`}
                            >
                              {webhook.active ? "Active" : "Disabled"}
                            </span>
                          </div>
                          <p className="mt-1 truncate font-mono text-xs text-gray-500">
                            {webhook.url}
                          </p>
                          <p className="mt-1 text-xs text-gray-600">
                            Events:{" "}
                            {webhook.events
                              .map((event) => WEBHOOK_EVENT_LABELS[event])
                              .join(", ")}
                          </p>
                          <p className="mt-1 text-xs text-gray-600">
                            Last triggered {formatDate(webhook.lastTriggeredAt)}
                          </p>
                          {webhook.lastError ? (
                            <p className="mt-1 text-xs text-red-400">
                              Last error: {webhook.lastError}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleActive(webhook.id, !webhook.active)
                            }
                            disabled={isPending}
                            className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5 disabled:opacity-50"
                          >
                            {webhook.active ? "Disable" : "Enable"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(webhook.id)}
                            disabled={isPending}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No webhook endpoints yet.</p>
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
