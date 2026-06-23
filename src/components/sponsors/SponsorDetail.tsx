"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  Building2,
  ExternalLink,
  Pencil,
  Trash2,
  Handshake,
  DollarSign,
  Target,
  MessageSquare,
} from "lucide-react";
import type { Sponsor } from "@/lib/sponsors";
import type { Contract } from "@/lib/contracts";
import type { SponsorCampaign } from "@/lib/campaigns";
import { RelatedContractsSection } from "@/components/contracts/RelatedContractsSection";
import { deleteSponsor } from "@/app/sponsors/actions";
import { SponsorLogo } from "./SponsorLogo";
import { SponsorStatusBadge } from "./SponsorStatusBadge";
import { IndustryBadge } from "./IndustryBadge";
import { SponsorFormModal } from "./SponsorFormModal";
import { CampaignStatusBadge } from "@/components/campaigns/CampaignStatusBadge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";

interface SponsorDetailProps {
  sponsor: Sponsor;
  contracts?: Contract[];
  campaigns?: SponsorCampaign[];
  canWrite?: boolean;
  canViewCampaigns?: boolean;
  isPortalUser?: boolean;
  unreadMessages?: number;
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

function ContactCard({
  contact,
  label,
}: {
  contact: Sponsor["primaryContact"];
  label: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-white">{contact.name}</p>
      {contact.title && (
        <p className="text-xs text-gray-500">{contact.title}</p>
      )}
      <div className="mt-4 space-y-2">
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center gap-2 text-sm text-gray-300 transition-colors hover:text-accent-light"
          >
            <Mail className="h-3.5 w-3.5 text-gray-500" />
            {contact.email}
          </a>
        )}
        {contact.phone && (
          <p className="flex items-center gap-2 text-sm text-gray-300">
            <Phone className="h-3.5 w-3.5 text-gray-500" />
            {contact.phone}
          </p>
        )}
      </div>
    </div>
  );
}

export function SponsorDetail({
  sponsor,
  contracts = [],
  campaigns = [],
  canWrite = true,
  canViewCampaigns = false,
  isPortalUser = false,
  unreadMessages = 0,
}: SponsorDetailProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const activeContracts = contracts.filter(
    (c) => c.status === "active" || c.status === "negotiating" || c.status === "draft"
  );
  const activeCampaigns = campaigns.filter((c) => c.status === "active");

  async function handleDelete() {
    if (
      !confirm(
        `Remove ${sponsor.companyName}? This cannot be undone.`
      )
    ) {
      return;
    }
    setDeleting(true);
    const result = await deleteSponsor(sponsor.id);
    if ("error" in result && result.error) {
      alert(result.error);
      setDeleting(false);
      return;
    }
    router.push("/sponsors");
    router.refresh();
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <Link
            href={isPortalUser ? "/portal" : "/sponsors"}
            className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-accent-light"
          >
            <ArrowLeft className="h-4 w-4" />
            {isPortalUser ? "Back to Portal" : "Back to Sponsors"}
          </Link>
          {canWrite && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            </div>
          )}
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06]">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/15 via-surface-raised to-surface" />
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative px-6 py-8 sm:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <SponsorLogo
                initials={sponsor.logoInitials}
                color={sponsor.logoColor}
                size="lg"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-3xl font-bold text-white">
                    {sponsor.companyName}
                  </h2>
                  <SponsorStatusBadge status={sponsor.status} />
                  <IndustryBadge industry={sponsor.industry} />
                </div>
                {sponsor.description ? (
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
                    {sponsor.description}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-gray-500">No description yet.</p>
                )}
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  {sponsor.website && (
                    <a
                      href={sponsor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-accent-light transition-colors hover:text-white"
                    >
                      <Globe className="h-4 w-4" />
                      Website
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  <span className="text-gray-400">
                    Lifetime spend:{" "}
                    <span className="font-semibold text-gray-200">
                      {sponsor.totalSpend}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            title="Active Deals"
            value={String(activeContracts.length)}
            subtitle={`${contracts.length} total contracts`}
            icon={Handshake}
            iconColor="text-emerald-400"
          />
          <MetricCard
            title="Lifetime Spend"
            value={sponsor.totalSpend}
            subtitle="Tracked from contracts"
            icon={DollarSign}
            iconColor="text-accent-light"
          />
          {canViewCampaigns && (
            <MetricCard
              title="Campaigns"
              value={String(campaigns.length)}
              subtitle={`${activeCampaigns.length} active`}
              icon={Target}
              iconColor="text-violet-400"
              href="/campaigns"
            />
          )}
        </div>

        {isPortalUser ? (
          <Section
            title="Partnership messaging"
            description="Deal rooms for your contracts and agency conversations"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4">
              <div className="flex items-start gap-3">
                <MessageSquare className="mt-0.5 h-5 w-5 text-accent-light" />
                <div>
                  <p className="text-sm font-medium text-gray-200">
                    {unreadMessages > 0
                      ? `${unreadMessages} unread message${unreadMessages === 1 ? "" : "s"}`
                      : "Message your agency team"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Open deal rooms from contract details or view all partnership
                    conversations in your inbox.
                  </p>
                </div>
              </div>
              <Link
                href="/messages"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-accent/40 hover:text-accent-light"
              >
                <MessageSquare className="h-4 w-4" />
                Open messages
              </Link>
            </div>
          </Section>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Company Information">
            <dl className="space-y-4">
              {sponsor.headquarters && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <div>
                    <dt className="text-xs text-gray-500">Headquarters</dt>
                    <dd className="text-sm text-gray-200">
                      {sponsor.headquarters}
                    </dd>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <dt className="text-xs text-gray-500">Industry</dt>
                  <dd className="mt-1">
                    <IndustryBadge industry={sponsor.industry} />
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <dt className="text-xs text-gray-500">Partner Since</dt>
                  <dd className="text-sm text-gray-200">{sponsor.joinedDate}</dd>
                </div>
              </div>
              {sponsor.founded && (
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <div>
                    <dt className="text-xs text-gray-500">Founded</dt>
                    <dd className="text-sm text-gray-200">{sponsor.founded}</dd>
                  </div>
                </div>
              )}
            </dl>
          </Section>

          <Section
            title="Contact Information"
            description="Primary and secondary points of contact"
          >
            <div className="space-y-4">
              <ContactCard
                contact={sponsor.primaryContact}
                label="Primary Contact"
              />
              {sponsor.secondaryContact && (
                <ContactCard
                  contact={sponsor.secondaryContact}
                  label="Secondary Contact"
                />
              )}
            </div>
          </Section>
        </div>

        {canViewCampaigns && (
          <Section
            title="Campaigns"
            description="Sponsor campaigns linked to this partner"
          >
            {campaigns.length === 0 ? (
              <EmptyState
                icon={Target}
                title="No campaigns yet"
                description="Create a campaign from the Campaigns page to track this sponsor's initiatives."
                action={
                  <Link
                    href="/campaigns"
                    className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
                  >
                    Go to Campaigns
                  </Link>
                }
              />
            ) : (
              <ul className="space-y-3">
                {campaigns.map((campaign) => (
                  <li key={campaign.id}>
                    <Link
                      href={`/campaigns/${campaign.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-colors hover:border-accent/30 hover:bg-white/[0.04]"
                    >
                      <div>
                        <p className="font-medium text-gray-200">{campaign.name}</p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {campaign.budgetDisplay} · {campaign.startDateDisplay} –{" "}
                          {campaign.endDateDisplay}
                        </p>
                      </div>
                      <CampaignStatusBadge status={campaign.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        )}

        <Section
          title="Contracts"
          description="Sponsorship agreements with this sponsor"
        >
          <RelatedContractsSection
            contracts={contracts}
            emptyMessage="No contracts linked to this sponsor yet."
          />
        </Section>

        {sponsor.internalNotes && !isPortalUser && (
          <Section
            title="Internal Notes"
            description="Confidential — visible to team members only"
          >
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-4">
              <p className="text-sm leading-relaxed text-gray-300">
                {sponsor.internalNotes}
              </p>
            </div>
          </Section>
        )}
      </div>

      <SponsorFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        sponsor={sponsor}
      />
    </>
  );
}
