"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  User,
  Building2,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import type { Creator } from "@/lib/creators";
import type { Sponsor } from "@/lib/sponsors";
import {
  type Contract,
  isContractOverdue,
  isExpiringSoon,
  type ContractNegotiationContext,
} from "@/lib/contracts";
import { deleteContract } from "@/app/contracts/actions";
import { ContractStatusBadge } from "./ContractStatusBadge";
import { ContractFormModal } from "./ContractFormModal";
import { ContractWorkflowActions } from "./ContractWorkflowActions";
import { ContractNegotiationPanel } from "./ContractNegotiationPanel";
import { ContractDeliverablesPanel } from "./ContractDeliverablesPanel";
import { ContractAiSummaryPanel } from "./ContractAiSummaryPanel";
import { DealRoomButton } from "@/components/messages/DealRoomButton";
import type { ContractDeliverable } from "@/lib/contract-deliverables";
import type { RelatedCampaignSummary } from "@/lib/campaigns/contract-links";
import { buildDeliverablesSummary } from "@/lib/contract-deliverables";
import { ContractDeliverablesSummary } from "./ContractDeliverablesPanel";
import { CampaignStatusBadge } from "@/components/campaigns/CampaignStatusBadge";

interface ContractDetailProps {
  contract: Contract;
  creators: Creator[];
  sponsors: Sponsor[];
  negotiationContext: ContractNegotiationContext | null;
  deliverables: ContractDeliverable[];
  relatedCampaigns?: RelatedCampaignSummary[];
  canWrite?: boolean;
  canUpdateStatus?: boolean;
  isPortalUser?: boolean;
  canUseAi?: boolean;
  aiMode?: "live" | "demo";
  dealRoomConversationId?: string | null;
  showDealRoom?: boolean;
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-6 backdrop-blur-sm">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function ContractDetail({
  contract,
  creators,
  sponsors,
  negotiationContext,
  deliverables,
  relatedCampaigns = [],
  canWrite = true,
  canUpdateStatus = false,
  isPortalUser = false,
  canUseAi = false,
  aiMode = "demo",
  dealRoomConversationId,
  showDealRoom = true,
}: ContractDetailProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const expiring = isExpiringSoon(contract);
  const overdue = isContractOverdue(contract);
  const deliverablesSummary = buildDeliverablesSummary(deliverables);

  async function handleDelete() {
    if (
      !confirm(
        `Delete "${contract.contractName}"? This cannot be undone.`
      )
    ) {
      return;
    }
    setDeleting(true);
    const result = await deleteContract(contract.id);
    if ("error" in result && result.error) {
      alert(result.error);
      setDeleting(false);
      return;
    }
    router.push("/contracts");
    router.refresh();
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href={isPortalUser ? "/portal" : "/contracts"}
            className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-accent-light"
          >
            <ArrowLeft className="h-4 w-4" />
            {isPortalUser ? "Back to Portal" : "Back to Contracts"}
          </Link>
          <div className="flex flex-wrap gap-2">
            {showDealRoom ? (
              <DealRoomButton
                type="contract"
                relatedId={contract.id}
                conversationId={dealRoomConversationId}
              />
            ) : null}
            {canWrite && (
              <>
                <button
                  onClick={() => setEditOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-surface-overlay hover:text-white"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {overdue && (
          <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
            <p className="text-sm text-red-200">
              This contract ended on {contract.endDateDisplay} but is still
              marked active. Mark it expired or extend the end date.
            </p>
          </div>
        )}

        {expiring && !overdue && (
          <div className="flex items-center gap-3 rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-orange-400" />
            <p className="text-sm text-orange-200">
              This contract expires on {contract.endDateDisplay}. Consider
              starting renewal discussions.
            </p>
          </div>
        )}

        {contract.sourceOpportunityId && !isPortalUser && (
          <div className="rounded-lg border border-border bg-surface-overlay/40 px-4 py-3 text-sm text-gray-400">
            Created from an accepted opportunity application.{" "}
            <Link
              href={`/opportunities/${contract.sourceOpportunityId}`}
              className="font-medium text-accent-light hover:text-white"
            >
              View opportunity
            </Link>
            {contract.sourceApplicationId && (
              <>
                {" · "}
                <Link
                  href="/opportunities/applications"
                  className="font-medium text-accent-light hover:text-white"
                >
                  View applications
                </Link>
              </>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-6 backdrop-blur-sm">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-white">
                {contract.contractName}
              </h2>
              <ContractStatusBadge status={contract.status} />
            </div>
            <div className="mt-5 flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-accent-light" />
                <span className="text-lg font-bold text-white">
                  {contract.valueDisplay}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <User className="h-4 w-4 text-gray-500" />
                <Link
                  href={`/creators/${contract.creatorId}`}
                  className="transition-colors hover:text-accent-light"
                >
                  {contract.creatorName}
                </Link>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Building2 className="h-4 w-4 text-gray-500" />
                <Link
                  href={`/sponsors/${contract.sponsorId}`}
                  className="transition-colors hover:text-accent-light"
                >
                  {contract.sponsorName}
                </Link>
              </div>
            </div>
            {deliverablesSummary.total > 0 ? (
              <div className="mt-5 max-w-md rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Deliverables progress
                </p>
                <div className="mt-3">
                  <ContractDeliverablesSummary
                    completed={deliverablesSummary.completed}
                    total={deliverablesSummary.total}
                    progressPercent={deliverablesSummary.progressPercent}
                    nextDueTitle={deliverablesSummary.nextDue?.title}
                    nextDueDateDisplay={deliverablesSummary.nextDue?.dueDateDisplay}
                    nextDueOverdue={deliverablesSummary.nextDue?.isOverdue}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface-raised p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
              <Calendar className="h-3.5 w-3.5" />
              Start Date
            </div>
            <p className="mt-2 text-lg font-semibold text-white">
              {contract.startDateDisplay}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface-raised p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
              <Calendar className="h-3.5 w-3.5" />
              End Date
            </div>
            <p
              className={`mt-2 text-lg font-semibold ${
                overdue
                  ? "text-red-400"
                  : expiring
                    ? "text-orange-400"
                    : "text-white"
              }`}
            >
              {contract.endDateDisplay}
            </p>
          </div>
        </div>

        <ContractDeliverablesPanel
          contractId={contract.id}
          deliverables={deliverables}
          relatedCampaigns={relatedCampaigns}
          canWrite={canWrite}
          canUpdateStatus={canUpdateStatus}
        />

        {relatedCampaigns.length > 0 ? (
          <Section
            title="Related campaigns"
            description="Campaigns with the same sponsor where this creator is assigned"
          >
            <ul className="divide-y divide-white/[0.06]">
              {relatedCampaigns.map((campaign) => (
                <li key={campaign.id}>
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 transition-colors hover:text-accent-light"
                  >
                    <div>
                      <p className="font-medium text-white">{campaign.name}</p>
                      <p className="text-sm text-gray-500">{campaign.sponsorName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-300">{campaign.budgetDisplay}</span>
                      <CampaignStatusBadge status={campaign.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {!isPortalUser ? (
          <>
            <Section
              title="Contract Workflow"
              description="Set deal value below, then advance when terms are agreed"
            >
              <ContractNegotiationPanel
                contract={contract}
                negotiationContext={negotiationContext}
                canWrite={canWrite}
              />
              <div className="mt-5">
                <ContractWorkflowActions contract={contract} canWrite={canWrite} />
              </div>
            </Section>

            <Section
              title="AI Contract Summary"
              description="Deal terms, deliverables, risks, and next steps"
            >
              <ContractAiSummaryPanel
                contractId={contract.id}
                contractName={contract.contractName}
                creatorName={contract.creatorName}
                sponsorName={contract.sponsorName}
                status={contract.status}
                contractValue={contract.contractValue}
                canUseAi={canUseAi}
                aiMode={aiMode}
              />
            </Section>
          </>
        ) : null}

        {contract.notes && !isPortalUser && (
          <Section
            title="Internal Notes"
            description="Confidential — team members only"
          >
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                {contract.notes}
              </p>
            </div>
          </Section>
        )}
      </div>

      <ContractFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        contract={contract}
        creators={creators}
        sponsors={sponsors}
      />
    </>
  );
}
