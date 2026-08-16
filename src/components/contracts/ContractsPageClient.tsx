"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Search, FileText } from "lucide-react";
import type { Creator } from "@/lib/creators";
import type { Sponsor } from "@/lib/sponsors";
import type { DeliverablesSummary } from "@/lib/contract-deliverables";
import {
  type Contract,
  type ContractStatus,
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
import { useStatusLabels } from "@/lib/i18n/use-status-labels";
import { cn } from "@/lib/utils";

type SortField = "value" | "startDate" | "endDate" | "status";
type SortDir = "asc" | "desc";
type StatusFilter = ContractStatus | "all";

interface ContractsPageClientProps {
  contracts: Contract[];
  creators: Creator[];
  sponsors: Sponsor[];
  deliverableSummaries?: Record<string, DeliverablesSummary>;
  canWrite?: boolean;
  initialSummaryFilter?: ContractSummaryFilter;
  isPortalUser?: boolean;
  initialCreateOpen?: boolean;
}

export function ContractsPageClient({
  contracts,
  creators,
  sponsors,
  deliverableSummaries = {},
  canWrite = true,
  initialSummaryFilter = null,
  isPortalUser = false,
  initialCreateOpen = false,
}: ContractsPageClientProps) {
  const t = useTranslations("contracts");
  const statusLabels = useStatusLabels();

  const quickFilters: Array<{
    value: ContractSummaryFilter | "all";
    label: string;
  }> = [
    { value: "all", label: t("filters.all") },
    { value: "active", label: t("filters.active") },
    { value: "pipeline", label: t("filters.pipeline") },
    { value: "expiring", label: t("filters.expiring") },
    { value: "overdue", label: t("filters.overdue") },
  ];

  const [modalOpen, setModalOpen] = useState(initialCreateOpen);
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
        statusLabels.contract(c.status).toLowerCase().includes(query);

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
  }, [contracts, search, statusFilter, summaryFilter, sortField, sortDir, statusLabels]);

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
      {!isPortalUser ? (
        <ContractSummaryCards
          activeCount={stats.activeCount}
          negotiatingCount={stats.negotiatingCount}
          expiringSoonCount={stats.expiringSoonCount}
          overdueCount={stats.overdueCount}
          totalValueDisplay={stats.totalValueDisplay}
          activeFilter={summaryFilter}
          onFilterChange={setSummaryFilter}
        />
      ) : null}

      {!isPortalUser && stats.overdueCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-red-100">
              {t("alerts.overdue", { count: stats.overdueCount })}
            </p>
            <p className="mt-0.5 text-xs text-red-200/80">
              {t("alerts.overdueDetail")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSummaryFilter("overdue")}
            className="shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-100 transition-colors hover:bg-red-500/20"
          >
            {t("alerts.viewOverdue")}
          </button>
        </div>
      ) : null}

      {!isPortalUser && stats.expiringSoonCount > 0 && stats.overdueCount === 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-500/25 bg-orange-500/10 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-orange-100">
              {t("alerts.expiring", { count: stats.expiringSoonCount })}
            </p>
            <p className="mt-0.5 text-xs text-orange-200/80">
              {t("alerts.expiringDetail")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSummaryFilter("expiring")}
            className="shrink-0 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-sm font-medium text-orange-100 transition-colors hover:bg-orange-500/20"
          >
            {t("alerts.viewExpiring")}
          </button>
        </div>
      ) : null}

      {!isPortalUser &&
      stats.negotiatingCount > 0 &&
      summaryFilter !== "pipeline" &&
      !hasActiveFilters ? (
        <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-100">
          {t("alerts.negotiating", { count: stats.negotiatingCount })}
        </p>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-md flex-1">
          <Input
            icon={<Search className="h-4 w-4" />}
            type="text"
            placeholder={
              isPortalUser
                ? t("filters.searchPortal")
                : t("filters.searchStaff")
            }
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
            <option value="all">{t("filters.allStatuses")}</option>
            {contractStatuses.map((s) => (
              <option key={s} value={s}>
                {statusLabels.contract(s)}
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
            <option value="value-desc">{t("sort.valueDesc")}</option>
            <option value="value-asc">{t("sort.valueAsc")}</option>
            <option value="startDate-desc">{t("sort.startDateDesc")}</option>
            <option value="startDate-asc">{t("sort.startDateAsc")}</option>
            <option value="endDate-desc">{t("sort.endDateDesc")}</option>
            <option value="endDate-asc">{t("sort.endDateAsc")}</option>
            <option value="status-asc">{t("sort.statusAsc")}</option>
            <option value="status-desc">{t("sort.statusDesc")}</option>
          </select>

          {canWrite ? (
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("actions.newContract")}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(isPortalUser
          ? quickFilters.filter(
              (f): f is (typeof quickFilters)[number] =>
                f.value === "all" || f.value === "active" || f.value === "overdue"
            )
          : quickFilters
        ).map((filter) => (
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
            contracts.length === 0
              ? isPortalUser
                ? t("empty.noDeals")
                : t("empty.noContracts")
              : isPortalUser
                ? t("empty.noMatchingDeals")
                : t("empty.noMatchingContracts")
          }
          description={
            contracts.length === 0
              ? isPortalUser
                ? t("empty.noDealsDescription")
                : t("empty.noContractsDescription")
              : t("empty.noMatchingDescription")
          }
          action={
            canWrite && contracts.length === 0 ? (
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" />
                {t("actions.createContract")}
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
                {t("actions.clearFilters")}
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="text-sm text-gray-500">
            {isPortalUser
              ? t("showingDeals", {
                  filtered: filtered.length,
                  total: contracts.length,
                })
              : t("showing", {
                  filtered: filtered.length,
                  total: contracts.length,
                })}
          </p>

          <div className="flex gap-0 lg:gap-6">
            <div className="min-w-0 flex-1">
              <ContractTable
                contracts={filtered}
                creators={creators}
                sponsors={sponsors}
                deliverableSummaries={deliverableSummaries}
                canWrite={canWrite}
                isPortalUser={isPortalUser}
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
