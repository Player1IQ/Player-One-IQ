"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Briefcase,
  Pencil,
  Trash2,
  Play,
  Pause,
  CheckCircle2,
  FileEdit,
} from "lucide-react";
import {
  type SponsorCampaign,
  type CampaignStatus,
  campaignStatusLabels,
} from "@/lib/campaigns";
import type { Sponsor } from "@/lib/sponsors";
import type { Opportunity } from "@/lib/opportunities";
import {
  deleteCampaign,
  updateCampaignStatus,
} from "@/app/campaigns/actions";
import { CampaignStatusBadge } from "./CampaignStatusBadge";
import { CampaignFormModal } from "./CampaignFormModal";
import { Button } from "@/components/ui/Button";

interface CampaignDetailProps {
  campaign: SponsorCampaign;
  sponsors: Sponsor[];
  opportunities: Opportunity[];
  canWrite?: boolean;
}

export function CampaignDetail({
  campaign,
  sponsors,
  opportunities,
  canWrite = true,
}: CampaignDetailProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(status: CampaignStatus) {
    setError("");
    startTransition(async () => {
      const result = await updateCampaignStatus(campaign.id, status);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  async function handleDelete() {
    if (!confirm(`Delete "${campaign.name}"? This cannot be undone.`)) return;

    const result = await deleteCampaign(campaign.id);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    router.push("/campaigns");
    router.refresh();
  }

  return (
    <>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-accent-light"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Campaigns
          </Link>
          {canWrite ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-surface-overlay hover:text-white"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-300 transition-colors hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          ) : null}
        </div>

        <section className="rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-6 backdrop-blur-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{campaign.name}</h1>
                <CampaignStatusBadge status={campaign.status} />
              </div>
              <Link
                href={`/sponsors/${campaign.sponsorId}`}
                className="mt-2 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-accent-light"
              >
                <Building2 className="h-4 w-4" />
                {campaign.sponsorName}
              </Link>
            </div>
            <p className="text-2xl font-semibold text-accent-light">
              {campaign.budgetDisplay}
            </p>
          </div>

          {canWrite ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {campaign.status === "draft" ? (
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleStatusChange("active")}
                >
                  <Play className="h-4 w-4" />
                  Launch campaign
                </Button>
              ) : null}
              {campaign.status === "active" ? (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={isPending}
                    onClick={() => handleStatusChange("paused")}
                  >
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleStatusChange("completed")}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark completed
                  </Button>
                </>
              ) : null}
              {campaign.status === "paused" ? (
                <>
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleStatusChange("active")}
                  >
                    <Play className="h-4 w-4" />
                    Resume
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={isPending}
                    onClick={() => handleStatusChange("completed")}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark completed
                  </Button>
                </>
              ) : null}
              {campaign.status === "completed" ? (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={isPending}
                  onClick={() => handleStatusChange("draft")}
                >
                  <FileEdit className="h-4 w-4" />
                  Reopen as draft
                </Button>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 text-sm text-red-400">{error}</p>
          ) : null}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-6">
            <h2 className="text-base font-semibold text-white">Timeline</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-gray-500">
                  <Calendar className="h-4 w-4" />
                  Start
                </dt>
                <dd className="text-gray-200">{campaign.startDateDisplay}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-gray-500">
                  <Calendar className="h-4 w-4" />
                  End
                </dt>
                <dd className="text-gray-200">{campaign.endDateDisplay}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-gray-500">
                  <DollarSign className="h-4 w-4" />
                  Budget
                </dt>
                <dd className="text-gray-200">{campaign.budgetDisplay}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-gray-500">Status</dt>
                <dd>{campaignStatusLabels[campaign.status]}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-6">
            <h2 className="text-base font-semibold text-white">Linked opportunity</h2>
            {campaign.relatedOpportunityId ? (
              <Link
                href={`/opportunities/${campaign.relatedOpportunityId}`}
                className="mt-4 inline-flex items-center gap-2 text-sm text-accent-light hover:text-white"
              >
                <Briefcase className="h-4 w-4" />
                {campaign.relatedOpportunityTitle ?? "View opportunity"}
              </Link>
            ) : (
              <p className="mt-4 text-sm text-gray-500">
                No opportunity linked. Edit the campaign to attach one from this
                sponsor.
              </p>
            )}
          </section>
        </div>

        {campaign.notes ? (
          <section className="rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-6">
            <h2 className="text-base font-semibold text-white">Notes</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
              {campaign.notes}
            </p>
          </section>
        ) : null}
      </div>

      {canWrite ? (
        <CampaignFormModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          campaign={campaign}
          sponsors={sponsors}
          opportunities={opportunities}
        />
      ) : null}
    </>
  );
}
