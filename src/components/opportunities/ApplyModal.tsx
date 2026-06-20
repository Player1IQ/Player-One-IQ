"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import type { Creator } from "@/lib/creators";
import type { Opportunity } from "@/lib/opportunities";
import { applyToOpportunity } from "@/app/opportunities/actions";

interface ApplyModalProps {
  open: boolean;
  onClose: () => void;
  opportunity: Opportunity;
  creators: Creator[];
  isPortalUser?: boolean;
  linkedCreatorId?: string | null;
}

export function ApplyModal({
  open,
  onClose,
  opportunity,
  creators,
  isPortalUser = false,
  linkedCreatorId = null,
}: ApplyModalProps) {
  const router = useRouter();
  const [creatorId, setCreatorId] = useState(linkedCreatorId ?? "");
  const [coverMessage, setCoverMessage] = useState("");
  const [proposedRate, setProposedRate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await applyToOpportunity({
      opportunityId: opportunity.id,
      creatorId: isPortalUser ? linkedCreatorId ?? "" : creatorId,
      coverMessage,
      proposedRate: proposedRate ? parseFloat(proposedRate) : null,
    });

    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    onClose();
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-surface-raised shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Apply to Opportunity</h2>
            <p className="text-xs text-gray-500">{opportunity.title}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {isPortalUser ? (
            !linkedCreatorId ? (
              <p className="text-sm text-amber-300">
                Your portal account is not linked to a creator profile.
              </p>
            ) : (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">
                    Cover Message
                  </label>
                  <textarea
                    value={coverMessage}
                    onChange={(e) => setCoverMessage(e.target.value)}
                    required
                    rows={4}
                    placeholder="Why are you a great fit for this opportunity?"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">
                    Proposed Rate ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={proposedRate}
                    onChange={(e) => setProposedRate(e.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200"
                  />
                </div>
              </>
            )
          ) : creators.length === 0 ? (
            <p className="text-sm text-amber-300">
              Add creators to your roster before applying.
            </p>
          ) : (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Creator</label>
                <select
                  value={creatorId}
                  onChange={(e) => setCreatorId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200"
                >
                  <option value="">Select creator</option>
                  {creators.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Cover Message</label>
                <textarea
                  value={coverMessage}
                  onChange={(e) => setCoverMessage(e.target.value)}
                  required
                  rows={4}
                  placeholder="Why is this creator a great fit?"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Proposed Rate ($)</label>
                <input
                  type="number"
                  min={0}
                  value={proposedRate}
                  onChange={(e) => setProposedRate(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-400">
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                (isPortalUser ? !linkedCreatorId : creators.length === 0)
              }
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
