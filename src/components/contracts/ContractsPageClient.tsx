"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import type { Creator } from "@/lib/creators";
import type { Sponsor } from "@/lib/sponsors";
import {
  type Contract,
  type ContractStatus,
  contractStatusLabels,
  contractStatuses,
  getContractStats,
  isContractOverdue,
  isExpiringSoon,
} from "@/lib/contracts";
import {
  ContractSummaryCards,
  type ContractSummaryFilter,
} from "./ContractSummaryCards";
import { ContractTable } from "./ContractTable";
import { ContractFormModal } from "./ContractFormModal";

type SortField = "value" | "startDate" | "endDate" | "status";
type SortDir = "asc" | "desc";

interface ContractsPageClientProps {
  contracts: Contract[];
  creators: Creator[];
  sponsors: Sponsor[];
  canWrite?: boolean;
  initialSummaryFilter?: ContractSummaryFilter;
}

export function ContractsPageClient({
  contracts,
  creators,
  sponsors,
  canWrite = true,
  initialSummaryFilter = null,
}: ContractsPageClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "all">(
    "all"
  );
  const [summaryFilter, setSummaryFilter] = useState<ContractSummaryFilter>(
    initialSummaryFilter
  );
  const [sortField, setSortField] = useState<SortField>("startDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const stats = getContractStats(contracts);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();

    let result = contracts.filter((c) => {
      const matchesSearch =
        c.contractName.toLowerCase().includes(query) ||
        c.creatorName.toLowerCase().includes(query) ||
        c.sponsorName.toLowerCase().includes(query) ||
        c.status.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || c.status === statusFilter;

      const matchesSummary =
        !summaryFilter ||
        (summaryFilter === "active" && c.status === "active") ||
        (summaryFilter === "pipeline" &&
          (c.status === "draft" || c.status === "negotiating")) ||
        (summaryFilter === "expiring" && isExpiringSoon(c)) ||
        (summaryFilter === "overdue" && isContractOverdue(c));

      return matchesSearch && matchesStatus && matchesSummary;
    });

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "value":
          cmp = a.contractValue - b.contractValue;
          break;
        case "startDate":
          cmp = (a.startDate ?? "").localeCompare(b.startDate ?? "");
          break;
        case "endDate":
          cmp = (a.endDate ?? "").localeCompare(b.endDate ?? "");
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [contracts, search, statusFilter, summaryFilter, sortField, sortDir]);

  return (
    <>
      <ContractSummaryCards
        activeCount={stats.activeCount}
        negotiatingCount={stats.negotiatingCount}
        expiringSoonCount={stats.expiringSoonCount}
        overdueCount={stats.overdueCount}
        totalValueDisplay={stats.totalValueDisplay}
        activeFilter={summaryFilter}
        onFilterChange={setSummaryFilter}
      />

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as ContractStatus | "all")
            }
            className="rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
          >
            <option value="all">All statuses</option>
            {contractStatuses.map((s) => (
              <option key={s} value={s}>
                {contractStatusLabels[s]}
              </option>
            ))}
          </select>

          <select
            value={`${sortField}-${sortDir}`}
            onChange={(e) => {
              const [field, dir] = e.target.value.split("-") as [
                SortField,
                SortDir,
              ];
              setSortField(field);
              setSortDir(dir);
            }}
            className="rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
          >
            <option value="value-desc">Value: High to Low</option>
            <option value="value-asc">Value: Low to High</option>
            <option value="startDate-desc">Start Date: Newest</option>
            <option value="startDate-asc">Start Date: Oldest</option>
            <option value="endDate-desc">End Date: Latest</option>
            <option value="endDate-asc">End Date: Earliest</option>
            <option value="status-asc">Status: A–Z</option>
            <option value="status-desc">Status: Z–A</option>
          </select>

          {canWrite && (
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent-dark"
            >
              <Plus className="h-4 w-4" />
              New Contract
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 text-sm text-gray-500">
        Showing{" "}
        <span className="font-medium text-gray-300">{filtered.length}</span> of{" "}
        {contracts.length} contracts
      </div>

      <ContractTable
        contracts={filtered}
        creators={creators}
        sponsors={sponsors}
        canWrite={canWrite}
      />

      {canWrite && (
        <ContractFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          creators={creators}
          sponsors={sponsors}
        />
      )}
    </>
  );
}
