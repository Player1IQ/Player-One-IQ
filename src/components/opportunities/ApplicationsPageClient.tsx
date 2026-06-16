"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Inbox,
  Users,
  XCircle,
} from "lucide-react";
import {
  type OpportunityApplication,
  type ApplicationStatus,
  applicationStatuses,
  applicationStatusLabels,
  getApplicationStats,
} from "@/lib/opportunities";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import { ApplicationContractLink } from "./ApplicationContractLink";
import { ApplicationReviewActions } from "./ApplicationReviewActions";
import { OpportunityStatusBadge } from "./OpportunityStatusBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlowCard } from "@/components/ui/GlowCard";
import { cn } from "@/lib/utils";

const selectClassName =
  "rounded-xl border border-white/[0.08] bg-surface-raised/80 px-3 py-2.5 text-sm text-gray-200 backdrop-blur-sm focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30";

interface ApplicationsPageClientProps {
  applications: OpportunityApplication[];
  canManage: boolean;
  organizationType?: string;
}

type StatusFilter = ApplicationStatus | "all" | "needs_action";

const quickFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "needs_action", label: "Needs action" },
  { value: "applied", label: "Applied" },
  { value: "under_review", label: "Under review" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

export function ApplicationsPageClient({
  applications,
  canManage,
  organizationType,
}: ApplicationsPageClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    "all"
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const stats = getApplicationStats(applications);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return applications.filter((a) => {
      const matchesSearch =
        a.creatorName.toLowerCase().includes(query) ||
        a.opportunityTitle.toLowerCase().includes(query) ||
        a.coverMessage.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "needs_action"
            ? a.status === "applied" || a.status === "under_review"
            : a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  const isSponsorOrg = organizationType === "Brand / Sponsor";
  const hasActiveFilters =
    search.trim().length > 0 || statusFilter !== "all";

  return (
    <div className="animate-fade-in space-y-8">
      <Link
        href="/opportunities"
        className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-accent-light"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Opportunities
      </Link>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Needs action"
          value={String(stats.needsAction)}
          subtitle="Applied or under review"
          icon={Inbox}
          iconColor="text-amber-400"
        />
        <MetricCard
          title="Under review"
          value={String(stats.underReview)}
          icon={Clock}
          iconColor="text-blue-400"
        />
        <MetricCard
          title="Accepted"
          value={String(stats.accepted)}
          icon={CheckCircle2}
          iconColor="text-emerald-400"
        />
        <MetricCard
          title="Total applications"
          value={String(stats.total)}
          icon={Users}
          iconColor="text-accent-light"
        />
      </div>

      {!canManage ? (
        <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-gray-400">
          You have view-only access. Owners and admins can review, accept, or
          reject applications from this hub.
        </p>
      ) : null}

      {canManage && stats.needsAction > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-amber-100">
              {stats.needsAction} application{stats.needsAction === 1 ? "" : "s"}{" "}
              need{stats.needsAction === 1 ? "s" : ""} review
            </p>
            <p className="mt-0.5 text-xs text-amber-200/80">
              Mark under review, accept to create a contract, or reject to close
              the loop.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter("needs_action")}
            className="shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-500/20"
          >
            Review queue
          </button>
        </div>
      ) : null}

      {canManage && applications.length > 0 && stats.needsAction === 0 ? (
        <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-100">
          All caught up — no applications waiting for review.
        </p>
      ) : null}

      {actionError ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {actionError}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Input
          type="search"
          placeholder="Search creator, opportunity, or message..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as StatusFilter)
          }
          className={selectClassName}
        >
          <option value="all">All statuses</option>
          <option value="needs_action">Needs action</option>
          {applicationStatuses.map((s) => (
            <option key={s} value={s}>
              {applicationStatusLabels[s]}
            </option>
          ))}
        </select>
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
            {filter.value === "needs_action" && stats.needsAction > 0 ? (
              <span className="ml-1.5 text-amber-400">({stats.needsAction})</span>
            ) : null}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={
            applications.length === 0
              ? "No applications yet"
              : "No matching applications"
          }
          description={
            applications.length === 0
              ? isSponsorOrg
                ? "Publish an open opportunity and creators in the network can apply. You'll review them here."
                : "When creators apply to your opportunities, they'll show up in this hub for review."
              : "Try a different search or status filter."
          }
          action={
            applications.length === 0 ? (
              <Link
                href="/opportunities"
                className="text-sm font-medium text-accent-light hover:text-white"
              >
                {canManage
                  ? isSponsorOrg
                    ? "Post an opportunity →"
                    : "Manage opportunities →"
                  : "Browse opportunities →"}
              </Link>
            ) : hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="text-sm font-medium text-accent-light hover:text-white"
              >
                Clear filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => {
            const expanded = expandedId === app.id;
            const actionable =
              canManage &&
              (app.status === "applied" || app.status === "under_review");

            return (
              <GlowCard key={app.id} className="overflow-hidden">
                <div className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/creators/${app.creatorId}`}
                          className="text-lg font-semibold text-white hover:text-accent-light"
                        >
                          {app.creatorName}
                        </Link>
                        <ApplicationStatusBadge status={app.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        <Link
                          href={`/opportunities/${app.opportunityId}`}
                          className="text-gray-300 hover:text-accent-light"
                        >
                          {app.opportunityTitle}
                        </Link>
                        <OpportunityStatusBadge status={app.opportunityStatus} />
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span>
                          Proposed rate:{" "}
                          <span className="text-gray-300">
                            {app.proposedRateDisplay}
                          </span>
                        </span>
                        <span>Applied {app.createdAtDisplay}</span>
                        {app.contractId ? (
                          <ApplicationContractLink contractId={app.contractId} />
                        ) : null}
                      </div>
                    </div>

                    {actionable ? (
                      <ApplicationReviewActions
                        applicationId={app.id}
                        status={app.status}
                        size="sm"
                        className="shrink-0"
                        onError={setActionError}
                      />
                    ) : app.status === "rejected" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                        <XCircle className="h-3.5 w-3.5" />
                        Closed
                      </span>
                    ) : null}
                  </div>

                  {app.coverMessage ? (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(expanded ? null : app.id)
                      }
                      className="mt-4 flex w-full items-center gap-2 text-left text-sm text-gray-400 hover:text-gray-300"
                    >
                      {expanded ? (
                        <ChevronUp className="h-4 w-4 shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      )}
                      <span className="line-clamp-1">
                        {expanded ? "Hide message" : app.coverMessage}
                      </span>
                    </button>
                  ) : null}

                  {expanded && app.coverMessage ? (
                    <p
                      className={cn(
                        "mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm leading-relaxed text-gray-300"
                      )}
                    >
                      {app.coverMessage}
                    </p>
                  ) : null}
                </div>
              </GlowCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
