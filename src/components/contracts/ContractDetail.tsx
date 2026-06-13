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
} from "@/lib/contracts";
import { deleteContract } from "@/app/contracts/actions";
import { ContractStatusBadge } from "./ContractStatusBadge";
import { ContractFormModal } from "./ContractFormModal";
import { ContractWorkflowActions } from "./ContractWorkflowActions";
import { DealRoomButton } from "@/components/messages/DealRoomButton";

interface ContractDetailProps {
  contract: Contract;
  creators: Creator[];
  sponsors: Sponsor[];
  canWrite?: boolean;
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
  canWrite = true,
}: ContractDetailProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const expiring = isExpiringSoon(contract);
  const overdue = isContractOverdue(contract);

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
            href="/contracts"
            className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-accent-light"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Contracts
          </Link>
          <div className="flex flex-wrap gap-2">
            <DealRoomButton type="contract" relatedId={contract.id} />
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

        {contract.sourceOpportunityId && (
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

        <Section
          title="Contract Workflow"
          description="Advance this contract through your deal pipeline"
        >
          <ContractWorkflowActions contract={contract} canWrite={canWrite} />
        </Section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Contract Information">
            <dl className="space-y-4">
              <div className="flex justify-between border-b border-border-subtle pb-3">
                <dt className="text-sm text-gray-500">Creator</dt>
                <dd>
                  <Link
                    href={`/creators/${contract.creatorId}`}
                    className="text-sm font-medium text-accent-light hover:text-white"
                  >
                    {contract.creatorName}
                  </Link>
                </dd>
              </div>
              <div className="flex justify-between border-b border-border-subtle pb-3">
                <dt className="text-sm text-gray-500">Sponsor</dt>
                <dd>
                  <Link
                    href={`/sponsors/${contract.sponsorId}`}
                    className="text-sm font-medium text-accent-light hover:text-white"
                  >
                    {contract.sponsorName}
                  </Link>
                </dd>
              </div>
              <div className="flex justify-between border-b border-border-subtle pb-3">
                <dt className="text-sm text-gray-500">Contract Value</dt>
                <dd className="text-sm font-semibold text-white">
                  {contract.valueDisplay}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Status</dt>
                <dd>
                  <ContractStatusBadge status={contract.status} />
                </dd>
              </div>
            </dl>
          </Section>

          <Section title="Deliverables">
            {contract.deliverables ? (
              <div className="rounded-lg border border-border-subtle bg-surface px-4 py-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                  {contract.deliverables}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No deliverables listed.</p>
            )}
          </Section>
        </div>

        {contract.notes && (
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
