"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Building2, Handshake, DollarSign } from "lucide-react";
import {
  type Sponsor,
  type SponsorStatus,
  sponsorStatuses,
  sponsorStatusLabels,
  getSponsorStats,
} from "@/lib/sponsors";
import { SponsorTable } from "./SponsorTable";
import { SponsorFormModal } from "./SponsorFormModal";
import { MetricCard } from "@/components/ui/MetricCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

const selectClassName =
  "rounded-xl border border-white/[0.08] bg-surface-raised/80 px-3 py-2.5 text-sm text-gray-200 backdrop-blur-sm focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30";

type StatusFilter = SponsorStatus | "all";

const quickFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: sponsorStatusLabels.active },
  { value: "negotiating", label: sponsorStatusLabels.negotiating },
  { value: "prospect", label: sponsorStatusLabels.prospect },
  { value: "inactive", label: sponsorStatusLabels.inactive },
];

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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const stats = getSponsorStats(sponsors);

  const pipelineValueDisplay = useMemo(() => {
    const total = sponsors.reduce((sum, sponsor) => {
      const numeric = Number(sponsor.totalSpend.replace(/[^0-9.-]+/g, ""));
      return sum + (Number.isFinite(numeric) ? numeric : 0);
    }, 0);
    if (total <= 0) return "—";
    return total.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }, [sponsors]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return sponsors.filter((sponsor) => {
      const matchesSearch =
        sponsor.companyName.toLowerCase().includes(query) ||
        sponsor.industry.toLowerCase().includes(query) ||
        sponsor.primaryContact.name.toLowerCase().includes(query) ||
        sponsorStatusLabels[sponsor.status].toLowerCase().includes(query) ||
        sponsor.headquarters.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" || sponsor.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sponsors, search, statusFilter]);

  const hasActiveFilters = search.trim().length > 0 || statusFilter !== "all";

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          title="Total Sponsors"
          value={String(stats.totalCount)}
          subtitle={`${stats.activeCount} active partnerships`}
          icon={Building2}
          iconColor="text-accent-light"
        />
        <MetricCard
          title="Active Deals"
          value={String(stats.totalActiveDeals)}
          subtitle="Draft, negotiating, and active contracts"
          icon={Handshake}
          iconColor="text-purple-400"
        />
        <MetricCard
          title="Pipeline Value"
          value={pipelineValueDisplay}
          subtitle="Active and negotiating contracts"
          icon={DollarSign}
          iconColor="text-emerald-400"
        />
      </div>

      {stats.negotiatingCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-amber-100">
              {stats.negotiatingCount} sponsor
              {stats.negotiatingCount === 1 ? "" : "s"} in negotiation
            </p>
            <p className="mt-0.5 text-xs text-amber-200/80">
              Follow up on terms and move partners to active when deals close.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter("negotiating")}
            className="shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-500/20"
          >
            View negotiating
          </button>
        </div>
      ) : null}

      {stats.prospectCount > 0 && stats.negotiatingCount === 0 ? (
        <p className="rounded-xl border border-sky-500/20 bg-sky-500/5 px-4 py-3 text-sm text-sky-100">
          {stats.prospectCount} prospect{stats.prospectCount === 1 ? "" : "s"} in
          your pipeline — qualify and advance when ready.
        </p>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-md flex-1">
          <Input
            icon={<Search className="h-4 w-4" />}
            type="text"
            placeholder="Search by company, industry, or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as StatusFilter)
            }
            className={selectClassName}
          >
            <option value="all">All statuses</option>
            {sponsorStatuses.map((status) => (
              <option key={status} value={status}>
                {sponsorStatusLabels[status]}
              </option>
            ))}
          </select>
          {canWrite ? (
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Sponsor
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatusFilter(filter.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              statusFilter === filter.value
                ? "border-accent/40 bg-accent/15 text-accent-light"
                : "border-white/[0.08] text-gray-500 hover:border-white/[0.12] hover:text-gray-300"
            )}
          >
            {filter.label}
            {filter.value === "active" && stats.activeCount > 0 ? (
              <span className="ml-1.5 text-emerald-400">({stats.activeCount})</span>
            ) : null}
            {filter.value === "negotiating" && stats.negotiatingCount > 0 ? (
              <span className="ml-1.5 text-amber-400">
                ({stats.negotiatingCount})
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={sponsors.length === 0 ? "No sponsors yet" : "No matching sponsors"}
          description={
            sponsors.length === 0
              ? "Add your first brand partner to track relationships and deals."
              : "Try a different search or status filter."
          }
          action={
            canWrite && sponsors.length === 0 ? (
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Add Sponsor
              </Button>
            ) : hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
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
            of {sponsors.length} sponsors
          </p>
          <SponsorTable sponsors={filtered} canWrite={canWrite} />
        </>
      )}

      {canWrite ? (
        <SponsorFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
      ) : null}
    </div>
  );
}
