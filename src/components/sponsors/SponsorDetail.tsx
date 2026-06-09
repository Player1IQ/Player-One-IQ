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
} from "lucide-react";
import type { Sponsor } from "@/lib/sponsors";
import type { Contract } from "@/lib/contracts";
import { RelatedContractsSection } from "@/components/contracts/RelatedContractsSection";
import { deleteSponsor } from "@/app/sponsors/actions";
import { SponsorLogo } from "./SponsorLogo";
import { SponsorStatusBadge } from "./SponsorStatusBadge";
import { IndustryBadge } from "./IndustryBadge";
import { SponsorFormModal } from "./SponsorFormModal";

interface SponsorDetailProps {
  sponsor: Sponsor;
  contracts?: Contract[];
  canWrite?: boolean;
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
    <section className="rounded-xl border border-border bg-surface-raised p-6 shadow-sm">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
      <div className="mt-5">{children}</div>
    </section>
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
    <div className="rounded-lg border border-border-subtle bg-surface p-4">
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
  canWrite = true,
}: SponsorDetailProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const activeContracts = contracts.filter(
    (c) => c.status === "active" || c.status === "negotiating" || c.status === "draft"
  );

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/sponsors"
            className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-accent-light"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sponsors
          </Link>
          {canWrite && (
            <div className="flex gap-2">
              <button
                onClick={() => setEditOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-surface-overlay hover:text-white"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            </div>
          )}
        </div>

        <div className="relative overflow-hidden rounded-xl border border-border bg-surface-raised p-6 shadow-sm">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/5" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
            <SponsorLogo
              initials={sponsor.logoInitials}
              color={sponsor.logoColor}
              size="lg"
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-white">
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
                  <>
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
                    <span className="text-gray-600">·</span>
                  </>
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
              <div>
                <dt className="text-xs text-gray-500">Active Deals</dt>
                <dd className="mt-1 text-2xl font-bold text-white">
                  {activeContracts.length}
                </dd>
              </div>
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

        <Section
          title="Contracts"
          description="Sponsorship agreements with this sponsor"
        >
          <RelatedContractsSection
            contracts={contracts}
            emptyMessage="No contracts linked to this sponsor yet."
          />
        </Section>

        {sponsor.internalNotes && (
          <Section
            title="Internal Notes"
            description="Confidential — visible to team members only"
          >
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-4">
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
