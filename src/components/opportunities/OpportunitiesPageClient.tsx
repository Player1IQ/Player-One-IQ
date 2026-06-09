"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Briefcase } from "lucide-react";
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
import type { Sponsor } from "@/lib/sponsors";

interface OpportunitiesPageClientProps {
  opportunities: Opportunity[];
  sponsors: Sponsor[];
  canManage: boolean;
}

export function OpportunitiesPageClient({
  opportunities,
  sponsors,
  canManage,
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
        <div className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-gray-400">Open Opportunities</p>
          <p className="mt-2 text-3xl font-bold text-white">{stats.openCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-gray-400">Total Opportunities</p>
          <p className="mt-2 text-3xl font-bold text-white">{stats.totalCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-gray-400">Total Applications</p>
          <p className="mt-2 text-3xl font-bold text-white">{stats.applicationCount}</p>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/opportunities/applications"
          className="text-sm text-accent-light hover:text-white"
        >
          View all applications →
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search opportunities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-raised py-2.5 pl-10 pr-4 text-sm text-gray-200"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as OpportunityStatus | "all")
            }
            className="rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-sm text-gray-200"
          >
            <option value="all">All statuses</option>
            {opportunityStatuses.map((s) => (
              <option key={s} value={s}>
                {opportunityStatusLabels[s]}
              </option>
            ))}
          </select>
          {canManage && (
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white"
            >
              <Plus className="h-4 w-4" />
              Create Opportunity
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-raised">
          <Briefcase className="h-10 w-10 text-gray-600" />
          <p className="mt-4 text-sm font-medium text-gray-300">No opportunities yet</p>
          <p className="mt-1 text-xs text-gray-500">
            {canManage
              ? "Create your first sponsorship opportunity."
              : "Check back when opportunities are published."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((opportunity) => (
            <Link
              key={opportunity.id}
              href={`/opportunities/${opportunity.id}`}
              className="group rounded-xl border border-border bg-surface-raised p-5 transition-colors hover:border-accent/30"
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
