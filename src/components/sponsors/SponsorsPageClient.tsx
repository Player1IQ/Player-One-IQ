"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Search, Building2, Handshake, DollarSign } from "lucide-react";
import {
  type Sponsor,
  type SponsorStatus,
  sponsorStatuses,
  getSponsorStats,
} from "@/lib/sponsors";
import { SponsorTable } from "./SponsorTable";
import { SponsorFormModal } from "./SponsorFormModal";
import { MetricCard } from "@/components/ui/MetricCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { useFormatCurrency } from "@/lib/i18n/format-client";
import { useStatusLabels } from "@/lib/i18n/use-status-labels";
import { cn } from "@/lib/utils";

const selectClassName =
  "rounded-xl border border-white/[0.08] bg-surface-raised/80 px-3 py-2.5 text-sm text-gray-200 backdrop-blur-sm focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30";

type StatusFilter = SponsorStatus | "all";

interface SponsorsPageClientProps {
  sponsors: Sponsor[];
  canWrite?: boolean;
  initialCreateOpen?: boolean;
}

export function SponsorsPageClient({
  sponsors,
  canWrite = true,
  initialCreateOpen = false,
}: SponsorsPageClientProps) {
  const t = useTranslations("sponsors");
  const statusLabels = useStatusLabels();
  const formatCurrency = useFormatCurrency();
  const quickFilters: Array<{ value: StatusFilter; label: string }> = [
    { value: "all", label: t("filters.all") },
    { value: "active", label: statusLabels.sponsor("active") },
    { value: "negotiating", label: statusLabels.sponsor("negotiating") },
    { value: "prospect", label: statusLabels.sponsor("prospect") },
    { value: "inactive", label: statusLabels.sponsor("inactive") },
  ];
  const [modalOpen, setModalOpen] = useState(initialCreateOpen);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const stats = getSponsorStats(sponsors);

  const pipelineValueDisplay = useMemo(() => {
    const total = sponsors.reduce((sum, sponsor) => {
      const numeric = Number(sponsor.totalSpend.replace(/[^0-9.-]+/g, ""));
      return sum + (Number.isFinite(numeric) ? numeric : 0);
    }, 0);
    if (total <= 0) return "—";
    return total <= 0 ? "—" : formatCurrency(total, "USD", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }, [sponsors, formatCurrency]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return sponsors.filter((sponsor) => {
      const matchesSearch =
        sponsor.companyName.toLowerCase().includes(query) ||
        sponsor.industry.toLowerCase().includes(query) ||
        sponsor.primaryContact.name.toLowerCase().includes(query) ||
        statusLabels.sponsor(sponsor.status).toLowerCase().includes(query) ||
        sponsor.headquarters.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" || sponsor.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sponsors, search, statusFilter, statusLabels]);

  const hasActiveFilters = search.trim().length > 0 || statusFilter !== "all";

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          title={t("metrics.totalSponsors")}
          value={String(stats.totalCount)}
          subtitle={t("metrics.activePartners", { count: stats.activeCount })}
          icon={Building2}
          iconColor="text-accent-light"
        />
        <MetricCard
          title={t("metrics.activeDeals")}
          value={String(stats.totalActiveDeals)}
          subtitle={t("metrics.activeDealsSubtitle")}
          icon={Handshake}
          iconColor="text-purple-400"
        />
        <MetricCard
          title={t("metrics.pipelineValue")}
          value={pipelineValueDisplay}
          subtitle={t("metrics.pipelineSubtitle")}
          icon={DollarSign}
          iconColor="text-emerald-400"
        />
      </div>

      {stats.negotiatingCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-amber-100">
              {t("alerts.negotiating", { count: stats.negotiatingCount })}
            </p>
            <p className="mt-0.5 text-xs text-amber-200/80">
              {t("alerts.negotiatingDetail")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter("negotiating")}
            className="shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-500/20"
          >
            {t("alerts.viewNegotiating")}
          </button>
        </div>
      ) : null}

      {stats.prospectCount > 0 && stats.negotiatingCount === 0 ? (
        <p className="rounded-xl border border-sky-500/20 bg-sky-500/5 px-4 py-3 text-sm text-sky-100">
          {t("alerts.prospects", { count: stats.prospectCount })}
        </p>
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
        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as StatusFilter)
            }
            className={selectClassName}
          >
            <option value="all">{t("filters.allStatuses")}</option>
            {sponsorStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels.sponsor(status)}
              </option>
            ))}
          </select>
          {canWrite ? (
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("actions.addSponsor")}
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
          title={sponsors.length === 0 ? t("empty.noSponsors") : t("empty.noMatching")}
          description={
            sponsors.length === 0
              ? t("empty.noSponsorsDescription")
              : t("empty.noMatchingDescription")
          }
          action={
            canWrite && sponsors.length === 0 ? (
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" />
                {t("actions.addSponsor")}
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
            {t("showing", { filtered: filtered.length, total: sponsors.length })}
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
