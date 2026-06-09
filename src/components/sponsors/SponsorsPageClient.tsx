"use client";

import { useState } from "react";
import { Plus, Search, Building2, Handshake, DollarSign } from "lucide-react";
import type { Sponsor } from "@/lib/sponsors";
import { SponsorTable } from "./SponsorTable";
import { SponsorFormModal } from "./SponsorFormModal";

interface SponsorsPageClientProps {
  sponsors: Sponsor[];
  canWrite?: boolean;
}

export function SponsorsPageClient({
  sponsors,
  canWrite = true,
}: SponsorsPageClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = sponsors.filter(
    (s) =>
      s.companyName.toLowerCase().includes(search.toLowerCase()) ||
      s.industry.toLowerCase().includes(search.toLowerCase()) ||
      s.primaryContact.name.toLowerCase().includes(search.toLowerCase()) ||
      s.status.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = sponsors.filter((s) => s.status === "active").length;
  const totalDeals = sponsors.reduce((sum, s) => sum + s.activeDeals, 0);

  return (
    <>
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface-raised p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-400">Total Sponsors</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/20">
              <Building2 className="h-4 w-4 text-accent-light" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-white">
            {sponsors.length}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            <span className="text-emerald-400">{activeCount}</span> active
            partnerships
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface-raised p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-400">Active Deals</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 ring-1 ring-purple-500/20">
              <Handshake className="h-4 w-4 text-purple-400" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-white">
            {totalDeals}
          </p>
          <p className="mt-1 text-xs text-gray-500">Across all sponsors</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-raised p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-400">Pipeline Value</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-white">
            {sponsors.length === 0 ? "—" : "$0"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Tracked when contracts are added
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by company, industry, or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-raised py-2.5 pl-10 pr-4 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
        </div>
        {canWrite && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent-dark"
          >
            <Plus className="h-4 w-4" />
            Add Sponsor
          </button>
        )}
      </div>

      <div className="mb-4 flex items-center gap-4 text-sm text-gray-500">
        <span>
          Showing{" "}
          <span className="font-medium text-gray-300">{filtered.length}</span>{" "}
          of {sponsors.length}
        </span>
      </div>

      <SponsorTable sponsors={filtered} canWrite={canWrite} />

      {canWrite && (
        <SponsorFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
