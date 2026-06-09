"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowLeft } from "lucide-react";
import {
  type OpportunityApplication,
  type ApplicationStatus,
  applicationStatuses,
  applicationStatusLabels,
} from "@/lib/opportunities";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import { ApplicationContractLink } from "./ApplicationContractLink";

interface ApplicationsPageClientProps {
  applications: OpportunityApplication[];
}

export function ApplicationsPageClient({
  applications,
}: ApplicationsPageClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">(
    "all"
  );

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return applications.filter((a) => {
      const matchesSearch =
        a.creatorName.toLowerCase().includes(query) ||
        a.opportunityTitle.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  return (
    <>
      <Link
        href="/opportunities"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-accent-light"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Opportunities
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by creator or opportunity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-raised py-2.5 pl-10 pr-4 text-sm text-gray-200"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as ApplicationStatus | "all")
          }
          className="rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-sm text-gray-200"
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
        <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-border bg-surface-raised">
          <p className="text-sm text-gray-500">No applications found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface-raised">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-overlay/60">
                <th className="px-6 py-3.5 text-xs font-semibold uppercase text-gray-500">Creator</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase text-gray-500">Opportunity</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase text-gray-500">Proposed Rate</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase text-gray-500">Status</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase text-gray-500">Applied</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase text-gray-500">Contract</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filtered.map((app) => (
                <tr key={app.id} className="hover:bg-accent/[0.03]">
                  <td className="px-6 py-4">
                    <Link
                      href={`/creators/${app.creatorId}`}
                      className="font-medium text-gray-200 hover:text-accent-light"
                    >
                      {app.creatorName}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/opportunities/${app.opportunityId}`}
                      className="text-gray-300 hover:text-accent-light"
                    >
                      {app.opportunityTitle}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{app.proposedRateDisplay}</td>
                  <td className="px-6 py-4">
                    <ApplicationStatusBadge status={app.status} />
                  </td>
                  <td className="px-6 py-4 text-gray-500">{app.createdAtDisplay}</td>
                  <td className="px-6 py-4">
                    {app.contractId ? (
                      <ApplicationContractLink contractId={app.contractId} />
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
