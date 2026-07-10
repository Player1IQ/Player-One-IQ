"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Target, Play, CheckCircle2, DollarSign } from "lucide-react";
import {
  type SponsorCampaign,
  type CampaignStatus,
  campaignStatuses,
  campaignStatusLabels,
  getCampaignStats,
} from "@/lib/campaigns";
import type { Sponsor } from "@/lib/sponsors";
import type { Opportunity } from "@/lib/opportunities";
import { CampaignStatusBadge } from "./CampaignStatusBadge";
import { CampaignFormModal } from "./CampaignFormModal";
import { MetricCard } from "@/components/ui/MetricCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

const selectClassName =
  "rounded-xl border border-white/[0.08] bg-surface-raised/80 px-3 py-2.5 text-sm text-gray-200 backdrop-blur-sm focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30";

type StatusFilter = CampaignStatus | "all";

const quickFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: campaignStatusLabels.active },
  { value: "draft", label: campaignStatusLabels.draft },
  { value: "paused", label: campaignStatusLabels.paused },
  { value: "completed", label: campaignStatusLabels.completed },
];

interface CampaignsPageClientProps {
  campaigns: SponsorCampaign[];
  sponsors: Sponsor[];
  opportunities: Opportunity[];
  canWrite?: boolean;
  isPortalUser?: boolean;
  isSponsorOrg?: boolean;
  defaultSponsorId?: string;
}

export function CampaignsPageClient({
  campaigns,
  sponsors,
  opportunities,
  canWrite = true,
  isPortalUser = false,
  isSponsorOrg = false,
  defaultSponsorId,
}: CampaignsPageClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const stats = getCampaignStats(campaigns);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return campaigns.filter((campaign) => {
      const matchesSearch =
        campaign.name.toLowerCase().includes(query) ||
        campaign.sponsorName.toLowerCase().includes(query) ||
        campaignStatusLabels[campaign.status].toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" || campaign.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [campaigns, search, statusFilter]);

  const hasActiveFilters = search.trim().length > 0 || statusFilter !== "all";

  const canCreateCampaign =
    canWrite && (sponsors.length > 0 || isSponsorOrg);
  const createButtonLabel = isSponsorOrg ? "Start a campaign" : "New Campaign";

  return (
    <div className="animate-fade-in space-y-6">
      {!isPortalUser ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Campaigns"
            value={String(stats.totalCount)}
            subtitle={`${stats.activeCount} active`}
            icon={Target}
            iconColor="text-accent-light"
          />
          <MetricCard
            title="Active"
            value={String(stats.activeCount)}
            subtitle="Currently running"
            icon={Play}
            iconColor="text-emerald-400"
          />
          <MetricCard
            title="Completed"
            value={String(stats.completedCount)}
            subtitle={`${stats.draftCount} in draft`}
            icon={CheckCircle2}
            iconColor="text-blue-400"
          />
          <MetricCard
            title="Total Budget"
            value={stats.totalBudgetDisplay}
            subtitle="Across all campaigns"
            icon={DollarSign}
            iconColor="text-amber-400"
          />
        </div>
      ) : null}

      {!isPortalUser && stats.draftCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-amber-100">
              {stats.draftCount} draft campaign{stats.draftCount === 1 ? "" : "s"}{" "}
              ready to launch
            </p>
            <p className="mt-0.5 text-xs text-amber-200/80">
              Open a campaign and launch it when you are ready to go live.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter("draft")}
            className="shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-500/20"
          >
            View drafts
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Input
          type="search"
          placeholder="Search campaigns..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="h-4 w-4" />}
          className="max-w-md flex-1"
        />
        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as StatusFilter)
            }
            className={selectClassName}
          >
            <option value="all">All statuses</option>
            {campaignStatuses.map((status) => (
              <option key={status} value={status}>
                {campaignStatusLabels[status]}
              </option>
            ))}
          </select>
          {canCreateCampaign && sponsors.length > 0 ? (
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              {createButtonLabel}
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
            {filter.value === "draft" && stats.draftCount > 0 ? (
              <span className="ml-1.5 text-amber-400">({stats.draftCount})</span>
            ) : null}
          </button>
        ))}
      </div>

      {sponsors.length === 0 && !isPortalUser ? (
        <EmptyState
          icon={Target}
          title={isSponsorOrg ? "Setting up your brand profile" : "Add a sponsor first"}
          description={
            isSponsorOrg
              ? "Refresh the page — your brand profile should appear momentarily so you can start a campaign."
              : "Create a sponsor in your CRM before tracking campaigns."
          }
          action={
            isSponsorOrg ? (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
              >
                Refresh page
              </button>
            ) : (
              <Link
                href="/sponsors"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
              >
                Go to Sponsors
              </Link>
            )
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Target}
          title={
            campaigns.length === 0
              ? isPortalUser
                ? "No campaigns assigned"
                : "No campaigns yet"
              : "No matching campaigns"
          }
          description={
            campaigns.length === 0
              ? isPortalUser
                ? "No campaigns assigned yet. Focus on marketplace opportunities and building your profile while your agency lines up deals."
                : isSponsorOrg
                  ? "Launch your first sponsorship campaign to track budget, status, and creators."
                  : "Create your first sponsor campaign to track budgets and status."
              : "Try a different search or status filter."
          }
          action={
            canWrite && campaigns.length === 0 && sponsors.length > 0 ? (
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" />
                {createButtonLabel}
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
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filtered.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className="block rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-4 transition-colors hover:border-accent/30 hover:bg-white/[0.02]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-200">{campaign.name}</p>
                    <p className="mt-1 text-sm text-gray-400">{campaign.sponsorName}</p>
                  </div>
                  <CampaignStatusBadge status={campaign.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span>{campaign.budgetDisplay}</span>
                  <span>
                    {campaign.startDateDisplay} – {campaign.endDateDisplay}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-2xl border border-white/[0.06] bg-surface-raised/80 backdrop-blur-sm md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3 font-medium">Campaign</th>
                  <th className="px-5 py-3 font-medium">Sponsor</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Budget</th>
                  <th className="px-5 py-3 font-medium">Dates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/campaigns/${campaign.id}`}
                        className="font-medium text-gray-200 hover:text-accent-light"
                      >
                        {campaign.name}
                      </Link>
                      {campaign.relatedOpportunityTitle ? (
                        <p className="mt-0.5 text-xs text-gray-500">
                          Linked: {campaign.relatedOpportunityTitle}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">
                      {isPortalUser ? (
                        <span className="text-gray-300">{campaign.sponsorName}</span>
                      ) : (
                        <Link
                          href={`/sponsors/${campaign.sponsorId}`}
                          className="text-gray-300 hover:text-accent-light"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {campaign.sponsorName}
                        </Link>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <CampaignStatusBadge status={campaign.status} />
                    </td>
                    <td className="px-5 py-4 text-gray-300">
                      {campaign.budgetDisplay}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {campaign.startDateDisplay} – {campaign.endDateDisplay}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {canWrite ? (
        <CampaignFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          sponsors={sponsors}
          opportunities={opportunities}
          defaultSponsorId={defaultSponsorId}
          lockSponsorSelection={isSponsorOrg && sponsors.length === 1}
        />
      ) : null}
    </div>
  );
}
