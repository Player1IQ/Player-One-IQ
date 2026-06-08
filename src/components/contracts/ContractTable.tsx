"use client";

import Link from "next/link";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Contract } from "@/lib/contracts";
import { isExpiringSoon } from "@/lib/contracts";
import { ContractStatusBadge } from "./ContractStatusBadge";

interface ContractTableProps {
  contracts: Contract[];
}

export function ContractTable({ contracts }: ContractTableProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  if (contracts.length === 0) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-border bg-surface-raised">
        <p className="text-sm text-gray-500">No contracts match your search.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface-raised shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-overlay/60">
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Contract Name
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Creator
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Sponsor
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Contract Value
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Expiration Date
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {contracts.map((contract) => {
              const expiring = isExpiringSoon(contract);

              return (
                <tr
                  key={contract.id}
                  className="group transition-colors hover:bg-accent/[0.03]"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/contracts/${contract.id}`}
                      className="block"
                    >
                      <p className="font-semibold text-gray-100 transition-colors group-hover:text-accent-light">
                        {contract.name}
                      </p>
                      {expiring && (
                        <span className="mt-1 inline-flex items-center rounded text-xs text-orange-400">
                          Expiring soon
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/creators/${contract.creatorId}`}
                      className="text-gray-300 transition-colors hover:text-accent-light"
                    >
                      {contract.creator}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/sponsors/${contract.sponsorId}`}
                      className="text-gray-300 transition-colors hover:text-accent-light"
                    >
                      {contract.sponsor}
                    </Link>
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
                    <span
                      className={
                        expiring ? "font-medium text-orange-400" : "text-gray-400"
                      }
                    >
                      {contract.expirationDate}
                    </span>
                  </td>
                  <td className="relative px-6 py-4">
                    <button
                      onClick={() =>
                        setOpenMenu(
                          openMenu === contract.id ? null : contract.id
                        )
                      }
                      className="rounded-lg p-1.5 text-gray-400 opacity-0 transition-all hover:bg-surface-overlay hover:text-gray-200 group-hover:opacity-100"
                      aria-label="Actions"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                    {openMenu === contract.id && (
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
                          <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-accent/10 hover:text-accent-light">
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                          <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10">
                            <Trash2 className="h-4 w-4" />
                            Archive
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
