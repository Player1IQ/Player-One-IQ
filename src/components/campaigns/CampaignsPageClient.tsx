"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Target, Play, CheckCircle2, DollarSign } from "lucide-react";
import {
  type SponsorCampaign,
  type CampaignStatus,
  campaignStatuses,
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

const selectClassName =
  "rounded-xl border border-white/[0.08] bg-surface-raised/80 px-3 py-2.5 text-sm text-gray-200 backdrop-blur-sm focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30";

interface CampaignsPageClientProps {
  campaigns: SponsorCampaign[];
  sponsors: Sponsor[];
  opportunities: Opportunity[];
  canWrite?: boolean;
}

export function CampaignsPageClient({
  campaigns,
  sponsors,
  opportunities,
  canWrite = true,
}: CampaignsPageClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">("all");

  const stats = getCampaignStats(campaigns);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return campaigns.filter((campaign) => {
      const matchesSearch =
        campaign.name.toLowerCase().includes(query) ||
        campaign.sponsorName.toLowerCase().includes(query) ||
        campaign.status.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" || campaign.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [campaigns, search, statusFilter]);

  return (
    <div className="animate-fade-in">
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
              setStatusFilter(e.target.value as CampaignStatus | "all")
            }
            className={selectClassName}
          >
            <option value="all">All statuses</option>
            {campaignStatuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
          {canWrite && sponsors.length > 0 && (
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              New Campaign
            </Button>
          )}
        </div>
      </div>

      {sponsors.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Add a sponsor first"
          description="Create a sponsor in your CRM before tracking campaigns."
          action={
            <Link
              href="/sponsors"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
            >
              Go to Sponsors
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Target}
          title={campaigns.length === 0 ? "No campaigns yet" : "No matches"}
          description={
            campaigns.length === 0
              ? "Create your first sponsor campaign to track budgets and status."
              : "Try adjusting your search or filters."
          }
          action={
            canWrite && campaigns.length === 0 ? (
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Campaign
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-surface-raised/80 backdrop-blur-sm">
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
                    <p className="font-medium text-gray-200">{campaign.name}</p>
                    {campaign.relatedOpportunityTitle && (
                      <p className="mt-0.5 text-xs text-gray-500">
                        Linked: {campaign.relatedOpportunityTitle}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/sponsors/${campaign.sponsorId}`}
                      className="text-gray-300 hover:text-accent-light"
                    >
                      {campaign.sponsorName}
                    </Link>
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
      )}

      {canWrite && (
        <CampaignFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          sponsors={sponsors}
          opportunities={opportunities}
        />
      )}
    </div>
  );
}
