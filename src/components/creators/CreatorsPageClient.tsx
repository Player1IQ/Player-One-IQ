"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Search, Users, UserCheck, Clock } from "lucide-react";
import {
  type Creator,
  type CreatorStatus,
  creatorStatuses,
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
import { useStatusLabels } from "@/lib/i18n/use-status-labels";

const selectClassName =
  "rounded-xl border border-white/[0.08] bg-surface-raised/80 px-3 py-2.5 text-sm text-gray-200 backdrop-blur-sm focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30";

type StatusFilter = CreatorStatus | "all";

interface CreatorsPageClientProps {
  creators: Creator[];
  canWrite?: boolean;
  showSeedButton?: boolean;
  initialCreateOpen?: boolean;
}

export function CreatorsPageClient({
  creators,
  canWrite = true,
  showSeedButton = false,
  initialCreateOpen = false,
}: CreatorsPageClientProps) {
  const t = useTranslations("creators");
  const statusLabels = useStatusLabels();
  const quickFilters: Array<{ value: StatusFilter; label: string }> = [
    { value: "all", label: t("filters.all") },
    { value: "active", label: statusLabels.creator("active") },
    { value: "pending", label: statusLabels.creator("pending") },
    { value: "on-hold", label: statusLabels.creator("on-hold") },
    { value: "inactive", label: statusLabels.creator("inactive") },
  ];
  const [modalOpen, setModalOpen] = useState(initialCreateOpen);
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
        statusLabels.creator(creator.status).toLowerCase().includes(query) ||
        creator.socialHandles.some((h) =>
          h.handle.toLowerCase().includes(query)
        );
      const matchesStatus =
        statusFilter === "all" || creator.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [creators, search, statusFilter, statusLabels]);

  const hasActiveFilters = search.trim().length > 0 || statusFilter !== "all";

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          title={t("metrics.totalCreators")}
          value={String(stats.totalCount)}
          subtitle={t("metrics.activeOnRoster", { count: stats.activeCount })}
          icon={Users}
          iconColor="text-accent-light"
        />
        <MetricCard
          title={t("metrics.active")}
          value={String(stats.activeCount)}
          subtitle={t("metrics.activeDescription")}
          icon={UserCheck}
          iconColor="text-emerald-400"
        />
        <MetricCard
          title={t("metrics.pending")}
          value={String(stats.pendingCount)}
          subtitle={t("metrics.onHold", { count: stats.onHoldCount })}
          icon={Clock}
          iconColor="text-amber-400"
        />
      </div>

      {stats.pendingCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-amber-100">
              {t("alerts.pendingOnboarding", { count: stats.pendingCount })}
            </p>
            <p className="mt-0.5 text-xs text-amber-200/80">
              {t("alerts.pendingOnboardingDetail")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className="shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-500/20"
          >
            {t("alerts.viewPending")}
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-md flex-1">
          <Input
            icon={<Search className="h-4 w-4" />}
            type="text"
            placeholder={t("filters.searchPlaceholder")}
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
            <option value="all">{t("filters.allStatuses")}</option>
            {creatorStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels.creator(status)}
              </option>
            ))}
          </select>
          {showSeedButton && canWrite ? <SeedTestDataButton /> : null}
          {canWrite ? (
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("actions.addCreator")}
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
          title={creators.length === 0 ? t("empty.noCreators") : t("empty.noMatching")}
          description={
            creators.length === 0
              ? t("empty.noCreatorsDescription")
              : t("empty.noMatchingDescription")
          }
          action={
            canWrite && creators.length === 0 ? (
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" />
                {t("actions.addCreator")}
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
                {t("actions.clearFilters")}
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="text-sm text-gray-500">
            {t("showing", { filtered: filtered.length, total: creators.length })}
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
