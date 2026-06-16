"use client";

import { useMemo, useState } from "react";
import { Plus, Search, FileText } from "lucide-react";
import type { Creator } from "@/lib/creators";
import type { Sponsor } from "@/lib/sponsors";
import type { DeliverablesSummary } from "@/lib/contract-deliverables";
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
import { ContractDetailPanel } from "./ContractDetailPanel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

type SortField = "value" | "startDate" | "endDate" | "status";
type SortDir = "asc" | "desc";
type StatusFilter = ContractStatus | "all";

const quickFilters: Array<{
  value: ContractSummaryFilter | "all";
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "pipeline", label: "Pipeline" },
  { value: "expiring", label: "Expiring" },
  { value: "overdue", label: "Overdue" },
];

interface ContractsPageClientProps {
  contracts: Contract[];
  creators: Creator[];
  sponsors: Sponsor[];
  deliverableSummaries?: Record<string, DeliverablesSummary>;
  canWrite?: boolean;
  initialSummaryFilter?: ContractSummaryFilter;
}

export function ContractsPageClient({
  contracts,
  creators,
  sponsors,
  deliverableSummaries = {},
  canWrite = true,
  initialSummaryFilter = null,
}: ContractsPageClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [summaryFilter, setSummaryFilter] = useState<ContractSummaryFilter>(
    initialSummaryFilter
  );
  const [sortField, setSortField] = useState<SortField>("startDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );

  const stats = getContractStats(contracts);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();

    let result = contracts.filter((c) => {
      const matchesSearch =
        c.contractName.toLowerCase().includes(query) ||
        c.creatorName.toLowerCase().includes(query) ||
        c.sponsorName.toLowerCase().includes(query) ||
        contractStatusLabels[c.status].toLowerCase().includes(query);

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

  const hasActiveFilters =
    search.trim().length > 0 ||
    statusFilter !== "all" ||
    summaryFilter !== null;

  function handleQuickFilter(value: ContractSummaryFilter | "all") {
    if (value === "all") {
      setSummaryFilter(null);
      return;
    }
    setSummaryFilter(summaryFilter === value ? null : value);
  }

  return (
    <div className="animate-fade-in space-y-6">
      <ContractSummaryCards
        activeCount={stats.activeCount}
        negotiatingCount={stats.negotiatingCount}
        expiringSoonCount={stats.expiringSoonCount}
        overdueCount={stats.overdueCount}
        totalValueDisplay={stats.totalValueDisplay}
        activeFilter={summaryFilter}
        onFilterChange={setSummaryFilter}
      />

      {stats.overdueCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-red-100">
              {stats.overdueCount} contract{stats.overdueCount === 1 ? "" : "s"}{" "}
              past end date
            </p>
            <p className="mt-0.5 text-xs text-red-200/80">
              Review overdue agreements and mark completed or expired.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSummaryFilter("overdue")}
            className="shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-100 transition-colors hover:bg-red-500/20"
          >
            View overdue
          </button>
        </div>
      ) : null}

      {stats.expiringSoonCount > 0 && stats.overdueCount === 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-500/25 bg-orange-500/10 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-orange-100">
              {stats.expiringSoonCount} contract
              {stats.expiringSoonCount === 1 ? "" : "s"} expiring within 45 days
            </p>
            <p className="mt-0.5 text-xs text-orange-200/80">
              Plan renewals or close out deliverables before the end date.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSummaryFilter("expiring")}
            className="shrink-0 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-sm font-medium text-orange-100 transition-colors hover:bg-orange-500/20"
          >
            View expiring
          </button>
        </div>
      ) : null}

      {stats.negotiatingCount > 0 &&
      summaryFilter !== "pipeline" &&
      !hasActiveFilters ? (
        <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-100">
          {stats.negotiatingCount} contract
          {stats.negotiatingCount === 1 ? "" : "s"} in draft or negotiation.
        </p>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-md flex-1">
          <Input
            icon={<Search className="h-4 w-4" />}
            type="text"
            placeholder="Search contracts, creators, or sponsors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as StatusFilter)
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

          {canWrite ? (
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              New Contract
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => handleQuickFilter(filter.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              (filter.value === "all" && summaryFilter === null) ||
                summaryFilter === filter.value
                ? "border-accent/40 bg-accent/15 text-accent-light"
                : "border-white/[0.08] text-gray-500 hover:border-white/[0.12] hover:text-gray-300"
            )}
          >
            {filter.label}
            {filter.value === "overdue" && stats.overdueCount > 0 ? (
              <span className="ml-1.5 text-red-400">({stats.overdueCount})</span>
            ) : null}
            {filter.value === "expiring" && stats.expiringSoonCount > 0 ? (
              <span className="ml-1.5 text-orange-400">
                ({stats.expiringSoonCount})
              </span>
            ) : null}
            {filter.value === "pipeline" && stats.negotiatingCount > 0 ? (
              <span className="ml-1.5 text-amber-400">
                ({stats.negotiatingCount})
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={
            contracts.length === 0 ? "No contracts yet" : "No matching contracts"
          }
          description={
            contracts.length === 0
              ? "Create your first sponsorship agreement to track value, status, and deliverables."
              : "Try a different search or filter."
          }
          action={
            canWrite && contracts.length === 0 ? (
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Contract
              </Button>
            ) : hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setSummaryFilter(null);
                }}
                className="text-sm text-accent-light hover:text-white"
              >
                Clear filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-medium text-gray-300">{filtered.length}</span>{" "}
            of {contracts.length} contracts
          </p>

          <div className="flex gap-0 lg:gap-6">
            <div className="min-w-0 flex-1">
              <ContractTable
                contracts={filtered}
                creators={creators}
                sponsors={sponsors}
                deliverableSummaries={deliverableSummaries}
                canWrite={canWrite}
                selectedId={selectedContract?.id}
                onSelect={setSelectedContract}
              />
            </div>
            {selectedContract ? (
              <ContractDetailPanel
                contract={selectedContract}
                deliverablesSummary={
                  deliverableSummaries[selectedContract.id] ?? null
                }
                onClose={() => setSelectedContract(null)}
              />
            ) : null}
          </div>
        </>
      )}

      {canWrite ? (
        <ContractFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          creators={creators}
          sponsors={sponsors}
        />
      ) : null}
    </div>
  );
}
