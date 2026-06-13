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
}

export function ApplicationsPageClient({
  applications,
  canManage,
}: ApplicationsPageClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">(
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
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

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
            setStatusFilter(e.target.value as ApplicationStatus | "all")
          }
          className={selectClassName}
        >
          <option value="all">All statuses</option>
          {applicationStatuses.map((s) => (
            <option key={s} value={s}>
              {applicationStatusLabels[s]}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No applications found"
          description={
            applications.length === 0
              ? "When creators apply to opportunities, they will appear here."
              : "Try a different search or status filter."
          }
          action={
            applications.length === 0 ? (
              <Link
                href="/opportunities"
                className="text-sm font-medium text-accent-light hover:text-white"
              >
                Browse opportunities →
              </Link>
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
