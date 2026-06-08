"use client";

import Link from "next/link";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Sponsor } from "@/lib/sponsors";
import { SponsorLogo } from "./SponsorLogo";
import { SponsorStatusBadge } from "./SponsorStatusBadge";
import { IndustryBadge } from "./IndustryBadge";

interface SponsorTableProps {
  sponsors: Sponsor[];
}

export function SponsorTable({ sponsors }: SponsorTableProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  if (sponsors.length === 0) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-border bg-surface-raised">
        <p className="text-sm text-gray-500">No sponsors match your search.</p>
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
                Company Logo
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Company Name
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Industry
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Primary Contact
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Active Deals
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {sponsors.map((sponsor) => (
              <tr
                key={sponsor.id}
                className="group transition-colors hover:bg-accent/[0.03]"
              >
                <td className="px-6 py-4">
                  <Link href={`/sponsors/${sponsor.id}`}>
                    <SponsorLogo
                      initials={sponsor.logoInitials}
                      color={sponsor.logoColor}
                      size="sm"
                    />
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/sponsors/${sponsor.id}`}
                    className="block"
                  >
                    <p className="font-semibold text-gray-100 transition-colors group-hover:text-accent-light">
                      {sponsor.companyName}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {sponsor.headquarters}
                    </p>
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <IndustryBadge industry={sponsor.industry} />
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-200">
                    {sponsor.primaryContact.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {sponsor.primaryContact.title}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-md bg-surface-overlay px-2 text-sm font-semibold text-gray-200 ring-1 ring-border">
                    {sponsor.activeDeals}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <SponsorStatusBadge status={sponsor.status} />
                </td>
                <td className="relative px-6 py-4">
                  <button
                    onClick={() =>
                      setOpenMenu(
                        openMenu === sponsor.id ? null : sponsor.id
                      )
                    }
                    className="rounded-lg p-1.5 text-gray-400 opacity-0 transition-all hover:bg-surface-overlay hover:text-gray-200 group-hover:opacity-100"
                    aria-label="Actions"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                  {openMenu === sponsor.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenu(null)}
                      />
                      <div className="absolute right-6 top-12 z-20 w-44 rounded-lg border border-border bg-surface-overlay py-1 shadow-xl ring-1 ring-white/5">
                        <Link
                          href={`/sponsors/${sponsor.id}`}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-accent/10 hover:text-accent-light"
                          onClick={() => setOpenMenu(null)}
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Link>
                        <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-accent/10 hover:text-accent-light">
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>
                        <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10">
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
