"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Search, Briefcase, FileText, Users } from "lucide-react";
import {
  type Opportunity,
  type OpportunityStatus,
  opportunityStatuses,
  opportunityStatusLabels,
  getOpportunityStats,
} from "@/lib/opportunities";
import { OpportunityStatusBadge } from "./OpportunityStatusBadge";
import { OpportunityFormModal } from "./OpportunityFormModal";
import { PlatformBadge } from "@/components/creators/PlatformBadge";
import { IndustryBadge } from "@/components/sponsors/IndustryBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import type { Creator } from "@/lib/creators";
import type { Sponsor } from "@/lib/sponsors";
import { OpportunityFitBadge } from "./OpportunityFitBadge";

const selectClassName =
  "rounded-xl border border-white/[0.08] bg-surface-raised/80 px-3 py-2.5 text-sm text-gray-200 backdrop-blur-sm focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30";

type StatusFilter = OpportunityStatus | "all";

const quickFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "open", label: opportunityStatusLabels.open },
  { value: "draft", label: opportunityStatusLabels.draft },
  { value: "closed", label: opportunityStatusLabels.closed },
  { value: "filled", label: opportunityStatusLabels.filled },
];

interface OpportunitiesPageClientProps {
  opportunities: Opportunity[];
  agencyOpportunities?: Opportunity[];
  marketplaceOpportunities?: Opportunity[];
  sponsors: Sponsor[];
  canManage: boolean;
  pendingReviewCount?: number;
  isPortalUser?: boolean;
  myApplicationCount?: number;
  myPendingCount?: number;
  portalCreator?: Creator | null;
  recommendedOpportunities?: Opportunity[];
}

type PortalTab = "agency" | "marketplace" | "recommended";

export function OpportunitiesPageClient({
  opportunities,
  agencyOpportunities = [],
  marketplaceOpportunities = [],
  sponsors,
  canManage,
  pendingReviewCount = 0,
  isPortalUser = false,
  myApplicationCount = 0,
  myPendingCount = 0,
  portalCreator = null,
  recommendedOpportunities = [],
}: OpportunitiesPageClientProps) {
  const searchParams = useSearchParams();
  const initialPortalTab = useMemo((): PortalTab => {
    const tab = searchParams.get("tab");
    if (tab === "marketplace") return "marketplace";
    if (tab === "recommended") return "recommended";
    return "agency";
  }, [searchParams]);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [portalTab, setPortalTab] = useState<PortalTab>(initialPortalTab);

  useEffect(() => {
    setPortalTab(initialPortalTab);
  }, [initialPortalTab]);

  const sourceOpportunities = isPortalUser
    ? portalTab === "agency"
      ? agencyOpportunities
      : portalTab === "marketplace"
        ? marketplaceOpportunities
        : recommendedOpportunities
    : opportunities;

  const stats = getOpportunityStats(opportunities);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return sourceOpportunities.filter((o) => {
      const matchesSearch =
        o.title.toLowerCase().includes(query) ||
        o.description.toLowerCase().includes(query) ||
        o.category.toLowerCase().includes(query) ||
        o.platform.toLowerCase().includes(query) ||
        opportunityStatusLabels[o.status].toLowerCase().includes(query) ||
        (o.sponsorName?.toLowerCase().includes(query) ?? false);
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sourceOpportunities, search, statusFilter]);

  const hasActiveFilters = search.trim().length > 0 || statusFilter !== "all";

  return (
    <div className="animate-fade-in space-y-6">
      {!isPortalUser ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            title="Open Opportunities"
            value={String(stats.openCount)}
            subtitle={`${stats.draftCount} in draft`}
            icon={Briefcase}
            iconColor="text-emerald-400"
          />
          <MetricCard
            title="Total Opportunities"
            value={String(stats.totalCount)}
            icon={FileText}
            iconColor="text-accent-light"
          />
          <MetricCard
            title="Total Applications"
            value={String(stats.applicationCount)}
            icon={Users}
            iconColor="text-violet-400"
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard
            title="Your agency"
            value={String(agencyOpportunities.length)}
            subtitle="Open opportunities from your organization"
            icon={Briefcase}
            iconColor="text-emerald-400"
          />
          <MetricCard
            title="Open marketplace"
            value={String(marketplaceOpportunities.length)}
            subtitle="Cross-org opportunities to discover"
            icon={Users}
            iconColor="text-violet-400"
          />
          <MetricCard
            title="Your applications"
            value={String(myApplicationCount)}
            subtitle={
              myPendingCount > 0
                ? `${myPendingCount} awaiting review`
                : "Submitted applications"
            }
            icon={FileText}
            iconColor="text-sky-400"
          />
        </div>
      )}

      {canManage && pendingReviewCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-amber-100">
              {pendingReviewCount} application
              {pendingReviewCount === 1 ? "" : "s"} waiting for review
            </p>
            <p className="mt-0.5 text-xs text-amber-200/80">
              Accept applications to create contracts or reject to close the loop.
            </p>
          </div>
          <Link
            href="/opportunities/applications"
            className="shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-500/20"
          >
            Review applications
          </Link>
        </div>
      ) : null}

      {canManage && stats.draftCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-500/25 bg-blue-500/10 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-blue-100">
              {stats.draftCount} draft opportunit
              {stats.draftCount === 1 ? "y" : "ies"} ready to publish
            </p>
            <p className="mt-0.5 text-xs text-blue-200/80">
              Open an opportunity when you are ready for creators to apply.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter("draft")}
            className="shrink-0 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-sm font-medium text-blue-100 transition-colors hover:bg-blue-500/20"
          >
            View drafts
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/opportunities/applications"
          className="inline-flex items-center gap-2 text-sm text-accent-light hover:text-white"
        >
          {isPortalUser ? "View my applications" : "View all applications"}
          {canManage && pendingReviewCount > 0 ? (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300 ring-1 ring-amber-500/25">
              {pendingReviewCount} to review
            </span>
          ) : isPortalUser && myPendingCount > 0 ? (
            <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-medium text-violet-300 ring-1 ring-violet-500/25">
              {myPendingCount} pending
            </span>
          ) : null}
          <span aria-hidden>→</span>
        </Link>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Input
          type="search"
          placeholder="Search opportunities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="h-4 w-4" />}
          className="max-w-md flex-1"
        />
        <div className="flex flex-wrap gap-3">
          {!isPortalUser ? (
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as StatusFilter)
              }
              className={selectClassName}
            >
              <option value="all">All statuses</option>
              {opportunityStatuses.map((s) => (
                <option key={s} value={s}>
                  {opportunityStatusLabels[s]}
                </option>
              ))}
            </select>
          ) : null}
          {canManage ? (
            <Button type="button" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Opportunity
            </Button>
          ) : null}
        </div>
      </div>

      {!isPortalUser ? (
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
              {filter.value === "open" && stats.openCount > 0 ? (
                <span className="ml-1.5 text-emerald-400">({stats.openCount})</span>
              ) : null}
              {filter.value === "draft" && stats.draftCount > 0 ? (
                <span className="ml-1.5 text-blue-400">({stats.draftCount})</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {isPortalUser ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPortalTab("agency")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              portalTab === "agency"
                ? "border-accent/40 bg-accent/15 text-accent-light"
                : "border-white/[0.08] text-gray-500 hover:border-white/[0.12] hover:text-gray-300"
            )}
          >
            Your agency
            {agencyOpportunities.length > 0 ? (
              <span className="ml-1.5 text-emerald-400">
                ({agencyOpportunities.length})
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setPortalTab("recommended")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              portalTab === "recommended"
                ? "border-accent/40 bg-accent/15 text-accent-light"
                : "border-white/[0.08] text-gray-500 hover:border-white/[0.12] hover:text-gray-300"
            )}
          >
            Recommended
            {recommendedOpportunities.length > 0 ? (
              <span className="ml-1.5 text-amber-400">
                ({recommendedOpportunities.length})
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setPortalTab("marketplace")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              portalTab === "marketplace"
                ? "border-accent/40 bg-accent/15 text-accent-light"
                : "border-white/[0.08] text-gray-500 hover:border-white/[0.12] hover:text-gray-300"
            )}
          >
            Open marketplace
            {marketplaceOpportunities.length > 0 ? (
              <span className="ml-1.5 text-violet-400">
                ({marketplaceOpportunities.length})
              </span>
            ) : null}
          </button>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={
            opportunities.length === 0
              ? "No opportunities yet"
              : "No matching opportunities"
          }
          description={
            sourceOpportunities.length === 0
              ? isPortalUser
                ? portalTab === "marketplace"
                  ? "No open marketplace opportunities right now. Check back as brands publish public listings."
                  : portalTab === "recommended"
                    ? "No recommended opportunities right now. Connect more platforms or update your profile to improve matches."
                    : "No open opportunities from your agency right now."
                : canManage
                  ? "Create your first sponsorship opportunity for creators to discover and apply."
                  : "Check back when opportunities are published."
              : "Try a different search or status filter."
          }
          action={
            canManage && opportunities.length === 0 ? (
              <Button type="button" size="sm" onClick={() => setModalOpen(true)}>
                Create Opportunity
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
          className="min-h-[280px]"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((opportunity) => (
            <Link
              key={opportunity.id}
              href={`/opportunities/${opportunity.id}`}
              className="group rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-5 backdrop-blur-sm transition-colors hover:border-accent/20 hover:bg-white/[0.02]"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-gray-100 group-hover:text-accent-light">
                  {opportunity.title}
                </h3>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  {opportunity.marketplaceListing ? (
                    <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-300 ring-1 ring-violet-500/25">
                      Marketplace
                    </span>
                  ) : null}
                  <OpportunityStatusBadge status={opportunity.status} />
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                {opportunity.description || "No description."}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <IndustryBadge industry={opportunity.category} />
                <PlatformBadge platform={opportunity.platform} />
                {isPortalUser && portalCreator ? (
                  <OpportunityFitBadge
                    opportunity={opportunity}
                    creator={portalCreator}
                  />
                ) : null}
              </div>
              {opportunity.sponsorName ? (
                <p className="mt-3 text-sm text-gray-400">
                  Sponsor:{" "}
                  <span className="text-gray-300">{opportunity.sponsorName}</span>
                </p>
              ) : null}
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="font-semibold text-white">
                  {opportunity.budgetDisplay}
                </span>
                {!isPortalUser ? (
                  <span className="text-gray-500">
                    {opportunity.applicationCount} applicant
                    {opportunity.applicationCount !== 1 ? "s" : ""}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Deadline: {opportunity.applicationDeadlineDisplay}
              </p>
            </Link>
          ))}
        </div>
      )}

      <OpportunityFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        sponsors={sponsors}
      />
    </div>
  );
}
