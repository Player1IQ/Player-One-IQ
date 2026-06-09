"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import {
  type Opportunity,
  type OpportunityInput,
  type OpportunityStatus,
  opportunityStatuses,
  opportunityCategories,
  opportunityPlatforms,
  opportunityStatusLabels,
} from "@/lib/opportunities";
import type { Industry } from "@/lib/sponsors";
import type { Platform } from "@/lib/creators";
import {
  createOpportunity,
  updateOpportunity,
} from "@/app/opportunities/actions";

interface OpportunityFormModalProps {
  open: boolean;
  onClose: () => void;
  opportunity?: Opportunity | null;
}

function toInput(opportunity: Opportunity): OpportunityInput {
  return {
    title: opportunity.title,
    description: opportunity.description,
    budget: opportunity.budget,
    category: opportunity.category,
    platform: opportunity.platform,
    deliverables: opportunity.deliverables,
    applicationDeadline: opportunity.applicationDeadline ?? "",
    status: opportunity.status,
  };
}

const defaultInput = (): OpportunityInput => ({
  title: "",
  description: "",
  budget: null,
  category: "Gaming",
  platform: "YouTube",
  deliverables: "",
  applicationDeadline: "",
  status: "draft",
});

export function OpportunityFormModal({
  open,
  onClose,
  opportunity,
}: OpportunityFormModalProps) {
  const router = useRouter();
  const isEdit = !!opportunity;
  const [form, setForm] = useState<OpportunityInput>(defaultInput());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(opportunity ? toInput(opportunity) : defaultInput());
      setError("");
    }
  }, [open, opportunity]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = isEdit
      ? await updateOpportunity(opportunity!.id, form)
      : await createOpportunity(form);

    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    onClose();
    router.refresh();
    if (!isEdit && "id" in result && result.id) {
      router.push(`/opportunities/${result.id}`);
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surface-raised shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface-raised px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? "Edit Opportunity" : "Create Opportunity"}
          </h2>
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

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="Q3 Gaming Campaign"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Describe the sponsorship opportunity..."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Budget ($)</label>
              <input
                type="number"
                min={0}
                value={form.budget ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    budget: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as OpportunityStatus })
                }
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200"
              >
                {opportunityStatuses.map((s) => (
                  <option key={s} value={s}>
                    {opportunityStatusLabels[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Category</label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as Industry })
                }
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200"
              >
                {opportunityCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Platform</label>
              <select
                value={form.platform}
                onChange={(e) =>
                  setForm({ ...form, platform: e.target.value as Platform })
                }
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200"
              >
                {opportunityPlatforms.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">Application Deadline</label>
            <input
              type="date"
              value={form.applicationDeadline}
              onChange={(e) =>
                setForm({ ...form, applicationDeadline: e.target.value })
              }
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">Deliverables</label>
            <textarea
              value={form.deliverables}
              onChange={(e) => setForm({ ...form, deliverables: e.target.value })}
              rows={3}
              placeholder="List required deliverables..."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-400">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Opportunity"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
