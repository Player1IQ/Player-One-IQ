"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Pencil,
  Trash2,
  XCircle,
  Users,
  Briefcase,
  MessageSquare,
} from "lucide-react";
import type { Creator } from "@/lib/creators";
import type { Opportunity, OpportunityApplication } from "@/lib/opportunities";
import type { Sponsor } from "@/lib/sponsors";
import {
  closeOpportunity,
  deleteOpportunity,
} from "@/app/opportunities/actions";
import { OpportunityStatusBadge } from "./OpportunityStatusBadge";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import { OpportunityFormModal } from "./OpportunityFormModal";
import { ApplyModal } from "./ApplyModal";
import { PlatformBadge } from "@/components/creators/PlatformBadge";
import { IndustryBadge } from "@/components/sponsors/IndustryBadge";
import { DealRoomButton } from "@/components/messages/DealRoomButton";
import { ApplicationContractLink } from "./ApplicationContractLink";
import { ApplicationReviewActions } from "./ApplicationReviewActions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";

interface OpportunityDetailProps {
  opportunity: Opportunity;
  applications: OpportunityApplication[];
  creators: Creator[];
  sponsors: Sponsor[];
  canManage: boolean;
  canApply: boolean;
  dealRoomConversationId?: string | null;
  isPortalUser?: boolean;
  linkedCreatorId?: string | null;
  hasApplied?: boolean;
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

export function OpportunityDetail({
  opportunity,
  applications,
  creators,
  sponsors,
  canManage,
  canApply,
  dealRoomConversationId,
  isPortalUser = false,
  linkedCreatorId = null,
  hasApplied = false,
}: OpportunityDetailProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const canApplyNow =
    canApply &&
    opportunity.status === "open" &&
    !hasApplied &&
    (isPortalUser ? Boolean(linkedCreatorId) : creators.length > 0);

  const acceptedContract = applications.find(
    (app) => app.status === "accepted" && app.contractId
  );
  const pendingCount = applications.filter(
    (a) => a.status === "applied" || a.status === "under_review"
  ).length;

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

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <Link
            href={isPortalUser ? "/opportunities" : "/opportunities"}
            className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-accent-light"
          >
            <ArrowLeft className="h-4 w-4" />
            {isPortalUser ? "Back to opportunities" : "Back to Opportunities"}
          </Link>
          <div className="flex flex-wrap gap-2">
            {!isPortalUser ? (
              <DealRoomButton
                type="opportunity"
                relatedId={opportunity.id}
                conversationId={dealRoomConversationId}
              />
            ) : null}
            {canApplyNow && (
              <Button size="sm" onClick={() => setApplyOpen(true)}>
                Apply
              </Button>
            )}
            {canManage && (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                {opportunity.status === "open" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClose}
                    disabled={loading}
                    className="border-amber-500/30 text-amber-400 hover:border-amber-500/50"
                  >
                    <XCircle className="h-4 w-4" />
                    Close
                  </Button>
                )}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06]">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-surface-raised to-surface" />
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="relative px-6 py-8 sm:px-8">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-bold text-white">{opportunity.title}</h2>
              <OpportunityStatusBadge status={opportunity.status} />
              {opportunity.marketplaceListing ? (
                <span className="rounded-full bg-violet-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-violet-300 ring-1 ring-violet-500/25">
                  Marketplace
                </span>
              ) : null}
              <IndustryBadge industry={opportunity.category} />
              <PlatformBadge platform={opportunity.platform} />
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-400">
              {opportunity.description || "No description provided."}
            </p>
            <div className="mt-5 flex flex-wrap gap-6 text-sm">
              <span className="inline-flex items-center gap-2 text-gray-300">
                <DollarSign className="h-4 w-4 text-accent-light" />
                {opportunity.budgetDisplay}
              </span>
              {opportunity.sponsorId && opportunity.sponsorName && (
                isPortalUser ? (
                  <span className="inline-flex items-center gap-2 text-gray-300">
                    <Building2 className="h-4 w-4 text-accent-light" />
                    {opportunity.sponsorName}
                  </span>
                ) : (
                  <Link
                    href={`/sponsors/${opportunity.sponsorId}`}
                    className="inline-flex items-center gap-2 text-gray-300 transition-colors hover:text-accent-light"
                  >
                    <Building2 className="h-4 w-4 text-accent-light" />
                    {opportunity.sponsorName}
                  </Link>
                )
              )}
              <span className="inline-flex items-center gap-2 text-gray-400">
                <Calendar className="h-4 w-4" />
                Deadline: {opportunity.applicationDeadlineDisplay}
              </span>
            </div>
          </div>
        </div>

        {!isPortalUser ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard
              title="Applications"
              value={String(applications.length)}
              subtitle={`${pendingCount} pending review`}
              icon={Users}
              iconColor="text-violet-400"
            />
            <MetricCard
              title="Budget"
              value={opportunity.budgetDisplay}
              subtitle="Proposed sponsorship"
              icon={DollarSign}
              iconColor="text-emerald-400"
            />
            <MetricCard
              title="Status"
              value={opportunity.status.replace(/_/g, " ")}
              subtitle="Current opportunity state"
              icon={Briefcase}
              iconColor="text-blue-400"
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard
              title="Budget"
              value={opportunity.budgetDisplay}
              subtitle="Proposed sponsorship"
              icon={DollarSign}
              iconColor="text-emerald-400"
            />
            <MetricCard
              title="Your application"
              value={hasApplied ? "Submitted" : "Not applied"}
              subtitle={
                hasApplied
                  ? applications[0]?.status.replace(/_/g, " ") ?? "Pending"
                  : "Apply before the deadline"
              }
              icon={Briefcase}
              iconColor="text-blue-400"
            />
          </div>
        )}

        {acceptedContract?.contractId && !isPortalUser && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <p className="text-sm text-emerald-300">
              This opportunity has been filled. A draft contract was created for{" "}
              {acceptedContract.creatorName}.
            </p>
            <ApplicationContractLink
              contractId={acceptedContract.contractId}
              className="mt-2"
            />
          </div>
        )}

        {opportunity.deliverables && (
          <Section title="Deliverables">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
              {opportunity.deliverables}
            </p>
          </Section>
        )}

        {isPortalUser ? (
          hasApplied && applications[0] ? (
            <Section
              title="Your application"
              description="Track your submission status"
            >
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-500">
                      Proposed: {applications[0].proposedRateDisplay}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Applied {applications[0].createdAtDisplay}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <ApplicationStatusBadge status={applications[0].status} />
                    {applications[0].contractId ? (
                      <ApplicationContractLink contractId={applications[0].contractId} />
                    ) : null}
                  </div>
                </div>
                {applications[0].coverMessage ? (
                  <p className="mt-3 text-sm text-gray-400">
                    {applications[0].coverMessage}
                  </p>
                ) : null}
              </div>
            </Section>
          ) : null
        ) : (
        <Section
          title="Applicants"
          description={`${applications.length} application${applications.length !== 1 ? "s" : ""}`}
        >
          {dealRoomConversationId ? (
            <div className="mb-4 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
              <p className="text-sm text-gray-300">
                Application updates and team notes appear in the deal room timeline.
              </p>
              <Link
                href={`/messages/${dealRoomConversationId}`}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-accent-light hover:text-white"
              >
                <MessageSquare className="h-4 w-4" />
                Go to deal room
              </Link>
            </div>
          ) : null}
          <div className="mb-4 flex justify-end">
            <Link
              href="/opportunities/applications"
              className="text-xs text-accent-light hover:text-white"
            >
              View all applications →
            </Link>
          </div>

          {applications.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No applications yet"
              description="Creators can apply when this opportunity is open."
            />
          ) : (
            <ul className="space-y-4">
              {applications.map((app) => (
                <li
                  key={app.id}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
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
                    <div className="flex flex-col items-end gap-2">
                      <ApplicationStatusBadge status={app.status} />
                      {app.contractId && (
                        <ApplicationContractLink contractId={app.contractId} />
                      )}
                    </div>
                  </div>
                  {app.coverMessage && (
                    <p className="mt-3 text-sm text-gray-400">{app.coverMessage}</p>
                  )}
                  {canManage ? (
                    <ApplicationReviewActions
                      applicationId={app.id}
                      status={app.status}
                      size="sm"
                      onError={(message) => alert(message)}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Section>
        )}
      </div>

      <OpportunityFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        opportunity={opportunity}
        sponsors={sponsors}
      />
      <ApplyModal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        opportunity={opportunity}
        creators={creators}
        isPortalUser={isPortalUser}
        linkedCreatorId={linkedCreatorId}
      />
    </>
  );
}
