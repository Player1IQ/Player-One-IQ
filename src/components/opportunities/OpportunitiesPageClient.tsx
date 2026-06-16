"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Briefcase, FileText, Users } from "lucide-react";
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
import type { Sponsor } from "@/lib/sponsors";

const selectClassName =
  "rounded-xl border border-white/[0.08] bg-surface-raised/80 px-3 py-2.5 text-sm text-gray-200 backdrop-blur-sm focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30";

interface OpportunitiesPageClientProps {
  opportunities: Opportunity[];
  sponsors: Sponsor[];
  canManage: boolean;
  pendingReviewCount?: number;
}

export function OpportunitiesPageClient({
  opportunities,
  sponsors,
  canManage,
  pendingReviewCount = 0,
}: OpportunitiesPageClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OpportunityStatus | "all">(
    "all"
  );

  const stats = getOpportunityStats(opportunities);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return opportunities.filter((o) => {
      const matchesSearch =
        o.title.toLowerCase().includes(query) ||
        o.description.toLowerCase().includes(query) ||
        o.category.toLowerCase().includes(query) ||
        o.platform.toLowerCase().includes(query) ||
        (o.sponsorName?.toLowerCase().includes(query) ?? false);
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [opportunities, search, statusFilter]);

  return (
    <>
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <MetricCard
          title="Open Opportunities"
          value={String(stats.openCount)}
          icon={Briefcase}
          iconColor="text-blue-400"
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

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/opportunities/applications"
          className="inline-flex items-center gap-2 text-sm text-accent-light hover:text-white"
        >
          View all applications
          {canManage && pendingReviewCount > 0 ? (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300 ring-1 ring-amber-500/25">
              {pendingReviewCount} to review
            </span>
          ) : null}
          <span aria-hidden>→</span>
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Input
          type="search"
          placeholder="Search opportunities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md flex-1"
        />
        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as OpportunityStatus | "all")
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
          {canManage && (
            <Button type="button" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Opportunity
            </Button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No opportunities yet"
          description={
            canManage
              ? "Create your first sponsorship opportunity."
              : "Check back when opportunities are published."
          }
          action={
            canManage ? (
              <Button type="button" size="sm" onClick={() => setModalOpen(true)}>
                Create Opportunity
              </Button>
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
              className="group rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-5 backdrop-blur-sm transition-colors hover:border-accent/20"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-gray-100 group-hover:text-accent-light">
                  {opportunity.title}
                </h3>
                <OpportunityStatusBadge status={opportunity.status} />
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                {opportunity.description || "No description."}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <IndustryBadge industry={opportunity.category} />
                <PlatformBadge platform={opportunity.platform} />
              </div>
              {opportunity.sponsorName && (
                <p className="mt-3 text-sm text-gray-400">
                  Sponsor:{" "}
                  <span className="text-gray-300">{opportunity.sponsorName}</span>
                </p>
              )}
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="font-semibold text-white">
                  {opportunity.budgetDisplay}
                </span>
                <span className="text-gray-500">
                  {opportunity.applicationCount} applicant
                  {opportunity.applicationCount !== 1 ? "s" : ""}
                </span>
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
    </>
  );
}
