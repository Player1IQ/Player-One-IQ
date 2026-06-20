"use client";

import Link from "next/link";
import {
  Briefcase,
  ExternalLink,
  FileText,
  MessageSquare,
  Target,
  User,
} from "lucide-react";
import type { Creator } from "@/lib/creators";
import type { Contract } from "@/lib/contracts";
import { presenceLabels } from "@/lib/presence/types";
import { CreatorAvatar } from "@/components/creators/CreatorAvatar";
import { PlatformBadge } from "@/components/creators/PlatformBadge";
import { StatusBadge } from "@/components/creators/StatusBadge";
import { ContractStatusBadge } from "@/components/contracts/ContractStatusBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

interface PortalHomeClientProps {
  creator: Creator;
  contracts: Contract[];
  unreadMessages: number;
  organizationName: string;
  roleLabel: string;
  showCampaigns: boolean;
  campaignCount: number;
}

export function PortalHomeClient({
  creator,
  contracts,
  unreadMessages,
  organizationName,
  roleLabel,
  showCampaigns,
  campaignCount,
}: PortalHomeClientProps) {
  const activeContracts = contracts.filter((contract) =>
    ["active", "negotiating", "draft"].includes(contract.status)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06]">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 via-surface-raised to-surface" />
        <div className="relative flex flex-col gap-5 px-6 py-8 sm:flex-row sm:items-center sm:px-8">
          <CreatorAvatar
            name={creator.name}
            imageUrl={creator.avatarUrl}
            initials={creator.avatarInitials}
            color={creator.avatarColor}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {organizationName} · {roleLabel}
            </p>
            <h2 className="mt-1 text-3xl font-bold text-white">{creator.name}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <StatusBadge status={creator.status} />
              <PlatformBadge platform={creator.primaryPlatform} />
            </div>
          </div>
          <Link
            href={`/creators/${creator.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:border-accent/40 hover:text-accent-light"
          >
            <User className="h-4 w-4" />
            View full profile
          </Link>
        </div>
      </div>

      <div
        className={`grid gap-4 ${showCampaigns ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"}`}
      >
        <MetricCard
          title="Active deals"
          value={String(activeContracts.length)}
          subtitle={`${contracts.length} total contracts`}
          icon={FileText}
          iconColor="text-emerald-400"
        />
        {showCampaigns ? (
          <MetricCard
            title="Campaigns"
            value={String(campaignCount)}
            subtitle={
              campaignCount === 1
                ? "Assigned campaign"
                : "Assigned campaigns"
            }
            icon={Target}
            iconColor="text-amber-400"
          />
        ) : null}
        <MetricCard
          title="Messages"
          value={String(unreadMessages)}
          subtitle={unreadMessages === 1 ? "Unread conversation" : "Unread conversations"}
          icon={MessageSquare}
          iconColor="text-violet-400"
        />
        <MetricCard
          title="Availability"
          value={presenceLabels[creator.availabilityStatus]}
          subtitle="Set by your agency"
          icon={Briefcase}
          iconColor="text-sky-400"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Card>
          <CardHeader>
            <CardTitle>Your contracts</CardTitle>
            <CardDescription>
              Sponsorship agreements linked to your roster profile
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {contracts.length === 0 ? (
              <p className="text-sm text-gray-500">
                No contracts yet. Your agency will add deals here as they progress.
              </p>
            ) : (
              <ul className="space-y-3">
                {contracts.slice(0, 5).map((contract) => (
                  <li key={contract.id}>
                    <Link
                      href={`/contracts/${contract.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-colors hover:border-accent/20 hover:bg-white/[0.04]"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-200">
                          {contract.contractName}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {contract.sponsorName} · {contract.valueDisplay}
                        </p>
                      </div>
                      <ContractStatusBadge status={contract.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {contracts.length > 0 ? (
              <Link
                href="/contracts"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-light hover:text-white"
              >
                View all contracts
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
            <CardDescription>Jump to the areas you use most</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <Link
              href={`/creators/${creator.id}`}
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] px-4 py-3 text-sm text-gray-300 transition-colors hover:border-accent/20 hover:text-white"
            >
              <User className="h-4 w-4 text-accent-light" />
              My profile
            </Link>
            <Link
              href="/messages"
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] px-4 py-3 text-sm text-gray-300 transition-colors hover:border-accent/20 hover:text-white"
            >
              <MessageSquare className="h-4 w-4 text-accent-light" />
              Messages
              {unreadMessages > 0 ? (
                <span className="ml-auto rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent-light">
                  {unreadMessages}
                </span>
              ) : null}
            </Link>
            {showCampaigns ? (
              <Link
                href="/campaigns"
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] px-4 py-3 text-sm text-gray-300 transition-colors hover:border-accent/20 hover:text-white"
              >
                <Target className="h-4 w-4 text-accent-light" />
                <span className="flex-1">Campaigns</span>
                {campaignCount > 0 ? (
                  <span className="text-xs text-gray-500">
                    {campaignCount} assigned
                  </span>
                ) : null}
              </Link>
            ) : null}
            <Link
              href="/portal/account"
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] px-4 py-3 text-sm text-gray-300 transition-colors hover:border-accent/20 hover:text-white"
            >
              <Briefcase className="h-4 w-4 text-accent-light" />
              Account
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
