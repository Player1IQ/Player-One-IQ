"use client";

import Link from "next/link";
import { Briefcase, ExternalLink } from "lucide-react";
import {
  getApplicationStats,
  type OpportunityApplication,
} from "@/lib/opportunities";
import { ApplicationStatusBadge } from "@/components/opportunities/ApplicationStatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface PortalApplicationsPanelProps {
  applications: OpportunityApplication[];
}

function StatChip({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "pending" | "success" | "muted";
}) {
  const toneClass =
    tone === "pending"
      ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
      : tone === "success"
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
        : tone === "muted"
          ? "border-white/[0.06] bg-white/[0.02] text-gray-400"
          : "border-white/[0.06] bg-white/[0.02] text-gray-200";

  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2 text-center",
        toneClass
      )}
    >
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-[11px] uppercase tracking-wider opacity-80">{label}</p>
    </div>
  );
}

export function PortalApplicationsPanel({
  applications,
}: PortalApplicationsPanelProps) {
  const stats = getApplicationStats(applications);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-sky-400" />
          My applications
        </CardTitle>
        <CardDescription>
          Track sponsorship applications you have submitted
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <StatChip label="Total" value={stats.total} />
          <StatChip label="Applied" value={stats.applied} tone="default" />
          <StatChip label="Review" value={stats.underReview} tone="pending" />
          <StatChip label="Accepted" value={stats.accepted} tone="success" />
          <StatChip label="Rejected" value={stats.rejected} tone="muted" />
        </div>

        {applications.length === 0 ? (
          <p className="text-sm text-gray-500">
            No applications yet. Browse the open marketplace to find sponsorship
            opportunities that fit your profile.
          </p>
        ) : (
          <ul className="space-y-3">
            {applications.map((application) => (
              <li key={application.id}>
                <Link
                  href={`/opportunities/${application.opportunityId}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-colors hover:border-accent/20 hover:bg-white/[0.04]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-200">
                      {application.opportunityTitle}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Submitted {application.createdAtDisplay}
                    </p>
                  </div>
                  <ApplicationStatusBadge status={application.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/opportunities/applications"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-light hover:text-white"
        >
          View all applications
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
