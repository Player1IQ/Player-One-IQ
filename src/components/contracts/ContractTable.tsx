"use client";

import Link from "next/link";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Creator } from "@/lib/creators";
import type { Sponsor } from "@/lib/sponsors";
import type { DeliverablesSummary } from "@/lib/contract-deliverables";
import {
  type Contract,
  isContractOverdue,
  isExpiringSoon,
} from "@/lib/contracts";
import { deleteContract } from "@/app/contracts/actions";
import { ContractStatusBadge } from "./ContractStatusBadge";
import { ContractFormModal } from "./ContractFormModal";
import { cn } from "@/lib/utils";

interface ContractTableProps {
  contracts: Contract[];
  creators: Creator[];
  sponsors: Sponsor[];
  deliverableSummaries?: Record<string, DeliverablesSummary>;
  canWrite?: boolean;
  isPortalUser?: boolean;
  selectedId?: string | null;
  onSelect?: (contract: Contract) => void;
}

function DeliverableProgress({
  summary,
}: {
  summary: DeliverablesSummary | undefined;
}) {
  if (!summary || summary.total === 0) {
    return <span className="text-xs text-gray-600">—</span>;
  }

  return (
    <div className="min-w-[88px]">
      <p className="text-xs text-gray-400">
        <span className="font-medium text-gray-300">{summary.completed}</span>/
        {summary.total}
      </p>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-accent/70"
          style={{ width: `${summary.progressPercent}%` }}
        />
      </div>
    </div>
  );
}

export function ContractTable({
  contracts,
  creators,
  sponsors,
  deliverableSummaries = {},
  canWrite = true,
  isPortalUser = false,
  selectedId,
  onSelect,
}: ContractTableProps) {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) {
      return;
    }
    setDeletingId(id);
    const result = await deleteContract(id);
    setDeletingId(null);
    setOpenMenu(null);
    if ("error" in result && result.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {contracts.map((contract) => {
          const expiring = isExpiringSoon(contract);
          const overdue = isContractOverdue(contract);
          const summary = deliverableSummaries[contract.id];

          return (
            <div
              key={contract.id}
              className={cn(
                "rounded-2xl border bg-surface-raised/80 p-4 transition-colors",
                selectedId === contract.id
                  ? "border-accent/40 bg-accent/[0.04]"
                  : "border-white/[0.06]"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/contracts/${contract.id}`}
                  className="min-w-0 flex-1"
                >
                  <p className="font-medium text-gray-200">
                    {contract.contractName}
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    {isPortalUser
                      ? contract.sponsorName
                      : `${contract.creatorName} · ${contract.sponsorName}`}
                  </p>
                </Link>
                <ContractStatusBadge status={contract.status} />
              </div>

              <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {contract.valueDisplay}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 text-xs",
                      overdue
                        ? "text-red-400"
                        : expiring
                          ? "text-orange-400"
                          : "text-gray-500"
                    )}
                  >
                    Ends {contract.endDateDisplay}
                    {overdue ? " · Overdue" : expiring ? " · Expiring soon" : ""}
                  </p>
                </div>
                <DeliverableProgress summary={summary} />
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => onSelect?.(contract)}
                  className="flex-1 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5"
                >
                  Quick view
                </button>
                <Link
                  href={`/contracts/${contract.id}`}
                  className="flex-1 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-center text-xs font-medium text-accent-light"
                >
                  Open
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-white/[0.06] bg-surface-raised/80 shadow-card backdrop-blur-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-overlay/60">
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Contract Name
                </th>
                {!isPortalUser ? (
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Creator
                  </th>
                ) : null}
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Sponsor
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Value
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Deliverables
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  End Date
                </th>
                {canWrite ? (
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {contracts.map((contract) => {
                const expiring = isExpiringSoon(contract);
                const overdue = isContractOverdue(contract);
                const summary = deliverableSummaries[contract.id];

                return (
                  <tr
                    key={contract.id}
                    onClick={() => onSelect?.(contract)}
                    className={cn(
                      "group cursor-pointer transition-colors hover:bg-accent/[0.04]",
                      selectedId === contract.id && "bg-accent/[0.06]"
                    )}
                  >
                    <td className="px-6 py-4">
                      <Link href={`/contracts/${contract.id}`} className="block">
                        <p className="font-semibold text-gray-100 transition-colors group-hover:text-accent-light">
                          {contract.contractName}
                        </p>
                        {overdue ? (
                          <span className="mt-1 inline-flex items-center text-xs text-red-400">
                            Overdue
                          </span>
                        ) : null}
                        {expiring && !overdue ? (
                          <span className="mt-1 inline-flex items-center text-xs text-orange-400">
                            Expiring soon
                          </span>
                        ) : null}
                      </Link>
                    </td>
                    {!isPortalUser ? (
                      <td className="px-6 py-4">
                        <Link
                          href={`/creators/${contract.creatorId}`}
                          className="text-gray-300 transition-colors hover:text-accent-light"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {contract.creatorName}
                        </Link>
                      </td>
                    ) : null}
                    <td className="px-6 py-4">
                      {isPortalUser ? (
                        <span className="text-gray-300">{contract.sponsorName}</span>
                      ) : (
                        <Link
                          href={`/sponsors/${contract.sponsorId}`}
                          className="text-gray-300 transition-colors hover:text-accent-light"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {contract.sponsorName}
                        </Link>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-white">
                        {contract.valueDisplay}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <ContractStatusBadge status={contract.status} />
                    </td>
                    <td className="px-6 py-4">
                      <DeliverableProgress summary={summary} />
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={
                          overdue
                            ? "font-medium text-red-400"
                            : expiring
                              ? "font-medium text-orange-400"
                              : "text-gray-400"
                        }
                      >
                        {contract.endDateDisplay}
                      </span>
                    </td>
                    {canWrite ? (
                      <td className="relative px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(
                              openMenu === contract.id ? null : contract.id
                            );
                          }}
                          className="rounded-lg p-1.5 text-gray-400 opacity-0 transition-all hover:bg-surface-overlay hover:text-gray-200 group-hover:opacity-100"
                          disabled={deletingId === contract.id}
                          aria-label="Actions"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                        {openMenu === contract.id ? (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMenu(null)}
                            />
                            <div className="absolute right-6 top-12 z-20 w-44 rounded-lg border border-border bg-surface-overlay py-1 shadow-xl ring-1 ring-white/5">
                              <Link
                                href={`/contracts/${contract.id}`}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-accent/10 hover:text-accent-light"
                                onClick={() => setOpenMenu(null)}
                              >
                                <Eye className="h-4 w-4" />
                                View Contract
                              </Link>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingContract(contract);
                                  setOpenMenu(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-accent/10 hover:text-accent-light"
                              >
                                <Pencil className="h-4 w-4" />
                                Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(
                                    contract.id,
                                    contract.contractName
                                  );
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          </>
                        ) : null}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {canWrite ? (
        <ContractFormModal
          open={!!editingContract}
          onClose={() => setEditingContract(null)}
          contract={editingContract}
          creators={creators}
          sponsors={sponsors}
        />
      ) : null}
    </>
  );
}
