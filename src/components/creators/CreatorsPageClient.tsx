"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Users, UserCheck, Clock } from "lucide-react";
import {
  type Creator,
  type CreatorStatus,
  creatorStatuses,
  creatorStatusLabels,
  getCreatorStats,
} from "@/lib/creators";
import { CreatorRosterTable } from "./CreatorRosterTable";
import { CreatorFormModal } from "./CreatorFormModal";
import { SeedTestDataButton } from "@/components/dev/SeedTestDataButton";
import { MetricCard } from "@/components/ui/MetricCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

const selectClassName =
  "rounded-xl border border-white/[0.08] bg-surface-raised/80 px-3 py-2.5 text-sm text-gray-200 backdrop-blur-sm focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30";

type StatusFilter = CreatorStatus | "all";

const quickFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: creatorStatusLabels.active },
  { value: "pending", label: creatorStatusLabels.pending },
  { value: "on-hold", label: creatorStatusLabels["on-hold"] },
  { value: "inactive", label: creatorStatusLabels.inactive },
];

interface CreatorsPageClientProps {
  creators: Creator[];
  canWrite?: boolean;
  showSeedButton?: boolean;
}

export function CreatorsPageClient({
  creators,
  canWrite = true,
  showSeedButton = false,
}: CreatorsPageClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const stats = getCreatorStats(creators);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return creators.filter((creator) => {
      const matchesSearch =
        creator.name.toLowerCase().includes(query) ||
        (creator.email?.toLowerCase().includes(query) ?? false) ||
        creator.primaryPlatform.toLowerCase().includes(query) ||
        creatorStatusLabels[creator.status].toLowerCase().includes(query) ||
        creator.socialHandles.some((h) =>
          h.handle.toLowerCase().includes(query)
        );
      const matchesStatus =
        statusFilter === "all" || creator.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [creators, search, statusFilter]);

  const hasActiveFilters = search.trim().length > 0 || statusFilter !== "all";

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          title="Total Creators"
          value={String(stats.totalCount)}
          subtitle={`${stats.activeCount} active on roster`}
          icon={Users}
          iconColor="text-accent-light"
        />
        <MetricCard
          title="Active"
          value={String(stats.activeCount)}
          subtitle="Currently managed creators"
          icon={UserCheck}
          iconColor="text-emerald-400"
        />
        <MetricCard
          title="Pending"
          value={String(stats.pendingCount)}
          subtitle={`${stats.onHoldCount} on hold`}
          icon={Clock}
          iconColor="text-amber-400"
        />
      </div>

      {stats.pendingCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-amber-100">
              {stats.pendingCount} creator{stats.pendingCount === 1 ? "" : "s"}{" "}
              pending onboarding
            </p>
            <p className="mt-0.5 text-xs text-amber-200/80">
              Complete profiles and connect platforms to activate them.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className="shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-500/20"
          >
            View pending
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-md flex-1">
          <Input
            icon={<Search className="h-4 w-4" />}
            type="text"
            placeholder="Search creators..."
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
            className={selectClassName}
          >
            <option value="all">All statuses</option>
            {creatorStatuses.map((status) => (
              <option key={status} value={status}>
                {creatorStatusLabels[status]}
              </option>
            ))}
          </select>
          {showSeedButton && canWrite ? <SeedTestDataButton /> : null}
          {canWrite ? (
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Creator
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
            {filter.value === "pending" && stats.pendingCount > 0 ? (
              <span className="ml-1.5 text-amber-400">({stats.pendingCount})</span>
            ) : null}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={creators.length === 0 ? "No creators yet" : "No matching creators"}
          description={
            creators.length === 0
              ? "Add your first creator to start building your roster."
              : "Try a different search or status filter."
          }
          action={
            canWrite && creators.length === 0 ? (
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Add Creator
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
            of {creators.length} creators
          </p>
          <CreatorRosterTable creators={filtered} canWrite={canWrite} />
        </>
      )}

      {canWrite ? (
        <CreatorFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
      ) : null}
    </div>
  );
}
