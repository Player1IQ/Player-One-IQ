"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Banknote, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import type { Creator } from "@/lib/creators";
import type { PayoutRecipient } from "@/lib/payments/types";
import {
  saveCreatorPayoutRecipient,
  savePayoutRecipient,
} from "@/app/payments/actions";

interface PayoutSettingsSectionProps {
  orgRecipient: PayoutRecipient | null;
  creatorRecipients: PayoutRecipient[];
  creators: Creator[];
  canEdit: boolean;
}

function PayoutInstructionsForm({
  initialInstructions,
  initialLabel,
  onSave,
  disabled,
}: {
  initialInstructions: string;
  initialLabel?: string;
  onSave: (
    instructions: string,
    label?: string
  ) => Promise<{ error?: string; success?: boolean }>;
  disabled?: boolean;
}) {
  const [instructions, setInstructions] = useState(initialInstructions);
  const [label, setLabel] = useState(initialLabel ?? "Primary");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    startTransition(async () => {
      const result = await onSave(instructions, label);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setMessage("Saved.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
          Label
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          disabled={disabled || isPending}
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white disabled:opacity-50"
        />
      </div>
      <div>
        <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
          Wire / ACH instructions
        </label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          disabled={disabled || isPending}
          rows={5}
          placeholder="Bank name, routing number, account number, beneficiary name, reference notes…"
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white placeholder:text-gray-600 disabled:opacity-50"
        />
      </div>
      {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {!disabled ? (
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save instructions
        </button>
      ) : null}
    </form>
  );
}

export function PayoutSettingsSection({
  orgRecipient,
  creatorRecipients,
  creators,
  canEdit,
}: PayoutSettingsSectionProps) {
  const [expandedCreatorId, setExpandedCreatorId] = useState<string | null>(
    null
  );

  const recipientByCreatorId = new Map(
    creatorRecipients
      .filter((r) => r.creatorId)
      .map((r) => [r.creatorId!, r])
  );

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-6 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <Banknote className="mt-0.5 h-5 w-5 text-accent-light" />
        <div className="flex-1">
          <h2 className="text-base font-semibold text-white">Payout settings</h2>
          <p className="mt-1 text-sm text-gray-500">
            Off-platform wire and ACH instructions for contract payouts. Player
            One IQ does not hold funds — in-app payments via Stripe Connect are
            coming soon.
          </p>

          <div className="mt-6 space-y-6">
            <div className="rounded-xl border border-white/[0.06] bg-surface px-4 py-4">
              <h3 className="text-sm font-semibold text-white">
                Organization payout account
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Default instructions when the organization is the payee.
              </p>
              <div className="mt-4">
                <PayoutInstructionsForm
                  initialInstructions={orgRecipient?.payoutInstructions ?? ""}
                  initialLabel={orgRecipient?.label}
                  disabled={!canEdit}
                  onSave={async (instructions, label) =>
                    savePayoutRecipient({ payoutInstructions: instructions, label })
                  }
                />
              </div>
              {orgRecipient?.connectStatus ? (
                <p className="mt-3 text-xs text-gray-500">
                  Stripe Connect: {orgRecipient.connectStatus.replace("_", " ")}
                </p>
              ) : null}
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-surface px-4 py-4">
              <h3 className="text-sm font-semibold text-white">
                Creator payout accounts
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Each creator can have wire/ACH instructions for completed
                contract payouts.
              </p>
              {creators.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">No creators yet.</p>
              ) : (
                <ul className="mt-4 divide-y divide-white/[0.06]">
                  {creators.map((creator) => {
                    const recipient = recipientByCreatorId.get(creator.id);
                    const expanded = expandedCreatorId === creator.id;
                    const hasInstructions = Boolean(
                      recipient?.payoutInstructions?.trim()
                    );

                    return (
                      <li key={creator.id} className="py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <Link
                              href={`/creators/${creator.id}`}
                              className="font-medium text-white hover:text-accent-light"
                            >
                              {creator.name}
                            </Link>
                            <p className="text-xs text-gray-500">
                              {hasInstructions
                                ? "Instructions on file"
                                : "No instructions yet"}
                            </p>
                          </div>
                          {canEdit ? (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedCreatorId(
                                  expanded ? null : creator.id
                                )
                              }
                              className="inline-flex items-center gap-1 text-sm text-accent-light hover:text-white"
                            >
                              {expanded ? (
                                <>
                                  Close
                                  <ChevronUp className="h-4 w-4" />
                                </>
                              ) : (
                                <>
                                  Edit
                                  <ChevronDown className="h-4 w-4" />
                                </>
                              )}
                            </button>
                          ) : null}
                        </div>
                        {expanded && canEdit ? (
                          <div className="mt-4 border-t border-white/[0.06] pt-4">
                            <PayoutInstructionsForm
                              key={recipient?.updatedAt ?? creator.id}
                              initialInstructions={
                                recipient?.payoutInstructions ?? ""
                              }
                              initialLabel={recipient?.label}
                              onSave={async (instructions, label) =>
                                saveCreatorPayoutRecipient({
                                  creatorId: creator.id,
                                  payoutInstructions: instructions,
                                  label,
                                })
                              }
                            />
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
