"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import type { Contract } from "@/lib/contracts";
import { getContractStats } from "@/lib/contracts";
import { ContractSummaryCards } from "./ContractSummaryCards";
import { ContractTable } from "./ContractTable";

interface ContractsPageClientProps {
  contracts: Contract[];
}

export function ContractsPageClient({ contracts }: ContractsPageClientProps) {
  const [search, setSearch] = useState("");
  const stats = getContractStats();

  const filtered = contracts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.creator.toLowerCase().includes(search.toLowerCase()) ||
      c.sponsor.toLowerCase().includes(search.toLowerCase()) ||
      c.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <ContractSummaryCards
        activeCount={stats.activeCount}
        pendingCount={stats.pendingCount}
        expiringSoonCount={stats.expiringSoonCount}
        totalValueDisplay={stats.totalValueDisplay}
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search contracts, creators, or sponsors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-raised py-2.5 pl-10 pr-4 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent-dark"
          onClick={() => alert("Add Contract form — coming soon")}
        >
          <Plus className="h-4 w-4" />
          New Contract
        </button>
      </div>

      <div className="mb-4 text-sm text-gray-500">
        Showing{" "}
        <span className="font-medium text-gray-300">{filtered.length}</span> of{" "}
        {contracts.length} contracts
      </div>

      <ContractTable contracts={filtered} />
    </>
  );
}
