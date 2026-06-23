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
import type { Creator } from "@/lib/creators";
import type { CampaignCreatorAssignment } from "@/lib/campaigns/assignments";
import type { RelatedContractSummary } from "@/lib/campaigns/contract-links";
import type { LinkedDeliverableSummary } from "@/lib/contract-deliverables/queries";
import {
  deliverableStatusBadgeVariant,
  deliverableStatusLabels,
} from "@/lib/contract-deliverables";
import {
  deleteCampaign,
  updateCampaignStatus,
} from "@/app/campaigns/actions";
import { CampaignCreatorsPanel } from "./CampaignCreatorsPanel";
import { CampaignStatusBadge } from "./CampaignStatusBadge";
import { ContractStatusBadge } from "@/components/contracts/ContractStatusBadge";
import { CampaignFormModal } from "./CampaignFormModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface CampaignDetailProps {
  campaign: SponsorCampaign;
  sponsors: Sponsor[];
  opportunities: Opportunity[];
  assignments: CampaignCreatorAssignment[];
  creators: Creator[];
  relatedContracts?: RelatedContractSummary[];
  linkedDeliverables?: LinkedDeliverableSummary[];
  canWrite?: boolean;
  canManageCreators?: boolean;
  isPortalUser?: boolean;
}

export function CampaignDetail({
  campaign,
  sponsors,
  opportunities,
  assignments,
  creators,
  relatedContracts = [],
  linkedDeliverables = [],
  canWrite = true,
  canManageCreators = false,
  isPortalUser = false,
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
            href={isPortalUser ? "/portal" : "/campaigns"}
            className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-accent-light"
          >
            <ArrowLeft className="h-4 w-4" />
            {isPortalUser ? "Back to Portal" : "Back to Campaigns"}
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
              {!isPortalUser ? (
                <Link
                  href={`/sponsors/${campaign.sponsorId}`}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-accent-light"
                >
                  <Building2 className="h-4 w-4" />
                  {campaign.sponsorName}
                </Link>
              ) : (
                <span className="mt-2 inline-flex items-center gap-1.5 text-sm text-gray-400">
                  <Building2 className="h-4 w-4" />
                  {campaign.sponsorName}
                </span>
              )}
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
              isPortalUser ? (
                <p className="mt-4 inline-flex items-center gap-2 text-sm text-gray-300">
                  <Briefcase className="h-4 w-4" />
                  {campaign.relatedOpportunityTitle ?? "Linked opportunity"}
                </p>
              ) : (
                <Link
                  href={`/opportunities/${campaign.relatedOpportunityId}`}
                  className="mt-4 inline-flex items-center gap-2 text-sm text-accent-light hover:text-white"
                >
                  <Briefcase className="h-4 w-4" />
                  {campaign.relatedOpportunityTitle ?? "View opportunity"}
                </Link>
              )
            ) : (
              <p className="mt-4 text-sm text-gray-500">
                {isPortalUser
                  ? "No opportunity linked to this campaign."
                  : "No opportunity linked. Edit the campaign to attach one from this sponsor."}
              </p>
            )}
          </section>
        </div>

        {campaign.notes && !isPortalUser ? (
          <section className="rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-6">
            <h2 className="text-base font-semibold text-white">Notes</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
              {campaign.notes}
            </p>
          </section>
        ) : null}

        {relatedContracts.length > 0 ? (
          <section className="rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-6">
            <h2 className="text-base font-semibold text-white">Related contracts</h2>
            <p className="mt-1 text-sm text-gray-500">
              Deals with the same sponsor and assigned creators
            </p>
            <ul className="mt-4 divide-y divide-white/[0.06]">
              {relatedContracts.map((contract) => (
                <li key={contract.id}>
                  <Link
                    href={`/contracts/${contract.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 transition-colors hover:text-accent-light"
                  >
                    <div>
                      <p className="font-medium text-white">{contract.contractName}</p>
                      <p className="text-sm text-gray-500">{contract.creatorName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-300">{contract.valueDisplay}</span>
                      <ContractStatusBadge status={contract.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {linkedDeliverables.length > 0 ? (
          <section className="rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-6">
            <h2 className="text-base font-semibold text-white">Linked deliverables</h2>
            <p className="mt-1 text-sm text-gray-500">
              Contract checklist items tied to this campaign
            </p>
            <ul className="mt-4 divide-y divide-white/[0.06]">
              {linkedDeliverables.map((deliverable) => (
                <li key={deliverable.id}>
                  <Link
                    href={`/contracts/${deliverable.contractId}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 transition-colors hover:text-accent-light"
                  >
                    <div>
                      <p className="font-medium text-white">{deliverable.title}</p>
                      <p className="text-sm text-gray-500">
                        {deliverable.contractName} · {deliverable.creatorName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {deliverable.dueDateDisplay !== "—" ? (
                        <span className="text-sm text-gray-400">
                          Due {deliverable.dueDateDisplay}
                        </span>
                      ) : null}
                      <Badge
                        variant={deliverableStatusBadgeVariant(
                          deliverable.displayStatus
                        )}
                      >
                        {deliverableStatusLabels[deliverable.displayStatus]}
                      </Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <CampaignCreatorsPanel
          campaignId={campaign.id}
          assignments={assignments}
          creators={creators}
          canManage={canManageCreators}
        />
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
