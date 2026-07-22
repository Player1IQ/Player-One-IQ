"use client";

import Link from "next/link";
import type { PortalDeliverableMetrics } from "@/lib/contract-deliverables/queries";
import {
  Building2,
  Calendar,
  CheckSquare,
  ExternalLink,
  FileText,
  MessageSquare,
  Target,
} from "lucide-react";
import type { Sponsor } from "@/lib/sponsors";
import type { Contract } from "@/lib/contracts";
import { SponsorLogo } from "@/components/sponsors/SponsorLogo";
import { SponsorStatusBadge } from "@/components/sponsors/SponsorStatusBadge";
import { IndustryBadge } from "@/components/sponsors/IndustryBadge";
import { ContractStatusBadge } from "@/components/contracts/ContractStatusBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { PortalAlertsBanner } from "@/components/portal/PortalAlertsBanner";

interface PortalSponsorHomeClientProps {
  sponsor: Sponsor;
  contracts: Contract[];
  unreadMessages: number;
  organizationName: string;
  organizationLogoUrl?: string | null;
  whiteLabelEnabled?: boolean;
  roleLabel: string;
  campaignCount: number;
  deliverableMetrics: PortalDeliverableMetrics;
}

export function PortalSponsorHomeClient({
  sponsor,
  contracts,
  unreadMessages,
  organizationName,
  organizationLogoUrl,
  whiteLabelEnabled = false,
  roleLabel,
  campaignCount,
  deliverableMetrics,
}: PortalSponsorHomeClientProps) {
  const activeContracts = contracts.filter((contract) =>
    ["active", "negotiating", "draft"].includes(contract.status)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PortalAlertsBanner
        overdueDeliverables={deliverableMetrics.overdueCount}
        unreadMessages={unreadMessages}
      />

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06]">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600/10 via-surface-raised to-surface" />
        <div className="relative flex flex-col gap-5 px-6 py-8 sm:flex-row sm:items-center sm:px-8">
          {organizationLogoUrl ? (
            <img
              src={organizationLogoUrl}
              alt={`${organizationName} logo`}
              className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-1 ring-white/10"
            />
          ) : (
            <SponsorLogo
              initials={sponsor.logoInitials}
              color={sponsor.logoColor}
              size="lg"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {organizationName} · {roleLabel}
            </p>
            <h2 className="mt-1 text-3xl font-bold text-white">{sponsor.companyName}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <SponsorStatusBadge status={sponsor.status} />
              <IndustryBadge industry={sponsor.industry} />
            </div>
          </div>
          <Link
            href={`/sponsors/${sponsor.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:border-accent/40 hover:text-accent-light"
          >
            <Building2 className="h-4 w-4" />
            View company profile
          </Link>
        </div>
        {!whiteLabelEnabled && organizationLogoUrl ? (
          <div className="relative border-t border-white/[0.04] px-6 py-2 sm:px-8">
            <p className="text-[10px] text-gray-600">
              Portal powered by Player One IQ
            </p>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <MetricCard
          title="Deliverables in progress"
          value={String(deliverableMetrics.openCount)}
          subtitle={
            deliverableMetrics.overdueCount > 0
              ? `${deliverableMetrics.overdueCount} overdue`
              : "Across your partnerships"
          }
          href="/contracts"
          icon={CheckSquare}
          iconColor={
            deliverableMetrics.overdueCount > 0
              ? "text-red-400"
              : "text-teal-400"
          }
        />
        <MetricCard
          title="Active deals"
          value={String(activeContracts.length)}
          subtitle={`${contracts.length} total contracts`}
          href="/contracts"
          icon={FileText}
          iconColor="text-emerald-400"
        />
        <MetricCard
          title="Campaigns"
          value={String(campaignCount)}
          subtitle={
            campaignCount === 1 ? "Active partnership" : "Partnership campaigns"
          }
          href="/campaigns"
          icon={Target}
          iconColor="text-violet-400"
        />
        <MetricCard
          title="Messages"
          value={String(unreadMessages)}
          subtitle={unreadMessages === 1 ? "Unread conversation" : "Unread conversations"}
          href="/messages"
          icon={MessageSquare}
          iconColor="text-violet-400"
        />
      </div>

      {deliverableMetrics.nextDue ? (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Calendar
                className={`mt-0.5 h-4 w-4 shrink-0 ${
                  deliverableMetrics.nextDue.isOverdue
                    ? "text-red-400"
                    : "text-accent-light"
                }`}
              />
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Next deliverable due
                </p>
                <p
                  className={`mt-1 text-sm font-medium ${
                    deliverableMetrics.nextDue.isOverdue
                      ? "text-red-300"
                      : "text-gray-200"
                  }`}
                >
                  {deliverableMetrics.nextDue.title}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Due {deliverableMetrics.nextDue.dueDateDisplay}
                </p>
              </div>
            </div>
            <Link
              href={`/contracts/${deliverableMetrics.nextDue.contractId}`}
              className="text-sm font-medium text-accent-light hover:text-white"
            >
              View contract
            </Link>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Card>
          <CardHeader>
            <CardTitle>Your contracts</CardTitle>
            <CardDescription>
              Sponsorship agreements with your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {contracts.length === 0 ? (
              <p className="text-sm text-gray-500">
                No contracts yet. Your agency will share deal details here as partnerships progress.
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
                          {contract.creatorName} · {contract.valueDisplay}
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
              href={`/sponsors/${sponsor.id}`}
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] px-4 py-3 text-sm text-gray-300 transition-colors hover:border-accent/20 hover:text-white"
            >
              <Building2 className="h-4 w-4 text-accent-light" />
              Company profile
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
            <Link
              href="/campaigns"
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] px-4 py-3 text-sm text-gray-300 transition-colors hover:border-accent/20 hover:text-white"
            >
              <Target className="h-4 w-4 text-accent-light" />
              <span className="flex-1">Campaigns</span>
              {campaignCount > 0 ? (
                <span className="text-xs text-gray-500">{campaignCount} active</span>
              ) : null}
            </Link>
            <Link
              href="/portal/account"
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] px-4 py-3 text-sm text-gray-300 transition-colors hover:border-accent/20 hover:text-white"
            >
              <Building2 className="h-4 w-4 text-accent-light" />
              Account
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
