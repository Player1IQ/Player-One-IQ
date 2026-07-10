"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import {
  type SponsorCampaign,
  type CampaignInput,
  type CampaignStatus,
  campaignStatuses,
  campaignStatusLabels,
} from "@/lib/campaigns";
import type { Sponsor } from "@/lib/sponsors";
import type { Opportunity } from "@/lib/opportunities";
import { createCampaign, updateCampaign } from "@/app/campaigns/actions";

interface CampaignFormModalProps {
  open: boolean;
  onClose: () => void;
  campaign?: SponsorCampaign | null;
  sponsors: Sponsor[];
  opportunities?: Opportunity[];
  defaultSponsorId?: string;
  lockSponsorSelection?: boolean;
}

function toInput(campaign: SponsorCampaign): CampaignInput {
  return {
    name: campaign.name,
    sponsorId: campaign.sponsorId,
    status: campaign.status,
    budget: campaign.budget,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    notes: campaign.notes,
    relatedOpportunityId: campaign.relatedOpportunityId,
  };
}

const defaultInput = (sponsorId = ""): CampaignInput => ({
  name: "",
  sponsorId,
  status: "draft",
  budget: null,
  startDate: null,
  endDate: null,
  notes: "",
  relatedOpportunityId: null,
});

export function CampaignFormModal({
  open,
  onClose,
  campaign,
  sponsors,
  opportunities = [],
  defaultSponsorId = "",
  lockSponsorSelection = false,
}: CampaignFormModalProps) {
  const router = useRouter();
  const isEdit = !!campaign;
  const initialSponsorId = defaultSponsorId || sponsors[0]?.id || "";
  const [form, setForm] = useState<CampaignInput>(defaultInput(initialSponsorId));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        campaign ? toInput(campaign) : defaultInput(initialSponsorId)
      );
      setError("");
    }
  }, [open, campaign, initialSponsorId]);

  if (!open) return null;

  const sponsorOpportunities = opportunities.filter(
    (o) => o.sponsorId === form.sponsorId
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = isEdit
      ? await updateCampaign(campaign!.id, form)
      : await createCampaign(form);

    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    onClose();
    if (!isEdit && "id" in result && result.id) {
      router.push(`/campaigns/${result.id}`);
    } else {
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/[0.08] bg-surface-raised shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-white/[0.06] bg-surface-raised px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? "Edit Campaign" : "Create Campaign"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">
              Campaign name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-white/[0.08] bg-surface px-4 py-2.5 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              required
            />
          </div>

          {lockSponsorSelection ? (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Brand
              </label>
              <p className="rounded-xl border border-white/[0.08] bg-surface px-4 py-2.5 text-sm text-gray-200">
                {sponsors.find((s) => s.id === form.sponsorId)?.companyName ??
                  "Your brand"}
              </p>
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Sponsor *
              </label>
              <select
                value={form.sponsorId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sponsorId: e.target.value,
                    relatedOpportunityId: null,
                  })
                }
                className="w-full rounded-xl border border-white/[0.08] bg-surface px-4 py-2.5 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
                required
              >
                <option value="">Select sponsor</option>
                {sponsors.map((sponsor) => (
                  <option key={sponsor.id} value={sponsor.id}>
                    {sponsor.companyName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as CampaignStatus,
                  })
                }
                className="w-full rounded-xl border border-white/[0.08] bg-surface px-4 py-2.5 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              >
                {campaignStatuses.map((status) => (
                  <option key={status} value={status}>
                    {campaignStatusLabels[status]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Budget (USD)
              </label>
              <input
                type="number"
                min={0}
                step={100}
                value={form.budget ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    budget: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="w-full rounded-xl border border-white/[0.08] bg-surface px-4 py-2.5 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Start date
              </label>
              <input
                type="date"
                value={form.startDate ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    startDate: e.target.value || null,
                  })
                }
                className="w-full rounded-xl border border-white/[0.08] bg-surface px-4 py-2.5 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                End date
              </label>
              <input
                type="date"
                value={form.endDate ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    endDate: e.target.value || null,
                  })
                }
                className="w-full rounded-xl border border-white/[0.08] bg-surface px-4 py-2.5 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>
          </div>

          {sponsorOpportunities.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Related opportunity
              </label>
              <select
                value={form.relatedOpportunityId ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    relatedOpportunityId: e.target.value || null,
                  })
                }
                className="w-full rounded-xl border border-white/[0.08] bg-surface px-4 py-2.5 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              >
                <option value="">None</option>
                {sponsorOpportunities.map((opportunity) => (
                  <option key={opportunity.id} value={opportunity.id}>
                    {opportunity.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-white/[0.08] bg-surface px-4 py-2.5 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              placeholder="Campaign goals, KPIs, or internal notes"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
