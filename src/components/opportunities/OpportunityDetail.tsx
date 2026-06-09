"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Pencil,
  Trash2,
  XCircle,
  Check,
  X,
  Eye,
} from "lucide-react";
import type { Creator } from "@/lib/creators";
import type { Opportunity, OpportunityApplication } from "@/lib/opportunities";
import {
  closeOpportunity,
  deleteOpportunity,
  acceptApplication,
  rejectApplication,
  markApplicationUnderReview,
} from "@/app/opportunities/actions";
import { OpportunityStatusBadge } from "./OpportunityStatusBadge";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import { OpportunityFormModal } from "./OpportunityFormModal";
import { ApplyModal } from "./ApplyModal";
import { PlatformBadge } from "@/components/creators/PlatformBadge";
import { IndustryBadge } from "@/components/sponsors/IndustryBadge";

interface OpportunityDetailProps {
  opportunity: Opportunity;
  applications: OpportunityApplication[];
  creators: Creator[];
  canManage: boolean;
  canApply: boolean;
}

export function OpportunityDetail({
  opportunity,
  applications,
  creators,
  canManage,
  canApply,
}: OpportunityDetailProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const canApplyNow =
    canApply &&
    opportunity.status === "open" &&
    creators.length > 0;

  async function handleClose() {
    if (!confirm("Close this opportunity? No new applications will be accepted.")) return;
    setLoading(true);
    const result = await closeOpportunity(opportunity.id);
    if ("error" in result && result.error) alert(result.error);
    else router.refresh();
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this opportunity? This cannot be undone.")) return;
    setLoading(true);
    const result = await deleteOpportunity(opportunity.id);
    if ("error" in result && result.error) {
      alert(result.error);
      setLoading(false);
      return;
    }
    router.push("/opportunities");
    router.refresh();
  }

  async function handleApplicationAction(
    id: string,
    action: "accept" | "reject" | "review"
  ) {
    const result =
      action === "accept"
        ? await acceptApplication(id)
        : action === "reject"
          ? await rejectApplication(id)
          : await markApplicationUnderReview(id);

    if ("error" in result && result.error) alert(result.error);
    else router.refresh();
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-accent-light"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Opportunities
          </Link>
          <div className="flex gap-2">
            {canApplyNow && (
              <button
                onClick={() => setApplyOpen(true)}
                className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white"
              >
                Apply
              </button>
            )}
            {canManage && (
              <>
                <button
                  onClick={() => setEditOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-gray-300"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                {opportunity.status === "open" && (
                  <button
                    onClick={handleClose}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 px-3 py-1.5 text-sm text-amber-400"
                  >
                    <XCircle className="h-4 w-4" />
                    Close
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface-raised p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-white">{opportunity.title}</h2>
            <OpportunityStatusBadge status={opportunity.status} />
            <IndustryBadge industry={opportunity.category} />
            <PlatformBadge platform={opportunity.platform} />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-gray-400">
            {opportunity.description || "No description provided."}
          </p>
          <div className="mt-5 flex flex-wrap gap-6 text-sm">
            <span className="inline-flex items-center gap-2 text-gray-300">
              <DollarSign className="h-4 w-4 text-accent-light" />
              {opportunity.budgetDisplay}
            </span>
            <span className="inline-flex items-center gap-2 text-gray-400">
              <Calendar className="h-4 w-4" />
              Deadline: {opportunity.applicationDeadlineDisplay}
            </span>
          </div>
        </div>

        {opportunity.deliverables && (
          <section className="rounded-xl border border-border bg-surface-raised p-6">
            <h3 className="text-base font-semibold text-white">Deliverables</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm text-gray-300">
              {opportunity.deliverables}
            </p>
          </section>
        )}

        <section className="rounded-xl border border-border bg-surface-raised p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Applicants</h3>
              <p className="mt-1 text-sm text-gray-500">
                {applications.length} application{applications.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Link
              href="/opportunities/applications"
              className="text-xs text-accent-light hover:text-white"
            >
              View all
            </Link>
          </div>

          {applications.length === 0 ? (
            <p className="mt-6 text-sm text-gray-500">No applications yet.</p>
          ) : (
            <ul className="mt-6 space-y-4">
              {applications.map((app) => (
                <li
                  key={app.id}
                  className="rounded-lg border border-border-subtle bg-surface p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/creators/${app.creatorId}`}
                        className="font-medium text-gray-200 hover:text-accent-light"
                      >
                        {app.creatorName}
                      </Link>
                      <p className="mt-1 text-sm text-gray-500">
                        Proposed: {app.proposedRateDisplay}
                      </p>
                    </div>
                    <ApplicationStatusBadge status={app.status} />
                  </div>
                  {app.coverMessage && (
                    <p className="mt-3 text-sm text-gray-400">{app.coverMessage}</p>
                  )}
                  {canManage &&
                    (app.status === "applied" || app.status === "under_review") && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {app.status === "applied" && (
                          <button
                            onClick={() => handleApplicationAction(app.id, "review")}
                            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-gray-300"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Under Review
                          </button>
                        )}
                        <button
                          onClick={() => handleApplicationAction(app.id, "accept")}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleApplicationAction(app.id, "reject")}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-2.5 py-1 text-xs text-red-400"
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </div>
                    )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <OpportunityFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        opportunity={opportunity}
      />
      <ApplyModal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        opportunity={opportunity}
        creators={creators}
      />
    </>
  );
}
