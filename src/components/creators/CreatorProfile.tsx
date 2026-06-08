import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Calendar,
  ExternalLink,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { Creator } from "@/lib/creators";
import { CreatorAvatar } from "./CreatorAvatar";
import { StatusBadge } from "./StatusBadge";
import { PlatformBadge } from "./PlatformBadge";

interface CreatorProfileProps {
  creator: Creator;
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
    <section className="rounded-xl border border-border bg-surface-raised p-6">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function CreatorProfile({ creator }: CreatorProfileProps) {
  return (
    <div className="space-y-6">
      <Link
        href="/creators"
        className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-accent-light"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Creators
      </Link>

      <div className="flex items-start gap-5 rounded-xl border border-border bg-surface-raised p-6">
        <CreatorAvatar
          initials={creator.avatarInitials}
          color={creator.avatarColor}
          size="lg"
        />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-white">{creator.name}</h2>
            <StatusBadge status={creator.status} />
          </div>
          <p className="mt-1 text-accent-light">{creator.displayName}</p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
            {creator.bio}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Creator Information">
          <dl className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <dt className="text-xs text-gray-500">Email</dt>
                <dd className="text-sm text-gray-200">{creator.email}</dd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-gray-500" />
              <div>
                <dt className="text-xs text-gray-500">Location</dt>
                <dd className="text-sm text-gray-200">{creator.location}</dd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <dt className="text-xs text-gray-500">Joined</dt>
                <dd className="text-sm text-gray-200">{creator.joinedDate}</dd>
              </div>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Primary Platform</dt>
              <dd className="mt-1">
                <PlatformBadge platform={creator.primaryPlatform} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Active Sponsors</dt>
              <dd className="mt-1 text-sm font-medium text-gray-200">
                {creator.activeSponsors}
              </dd>
            </div>
          </dl>
        </Section>

        <Section
          title="Social Media Accounts"
          description="Connected platforms and follower counts"
        >
          <ul className="space-y-3">
            {creator.socialAccounts.map((account) => (
              <li
                key={account.platform}
                className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <PlatformBadge platform={account.platform} />
                  <div>
                    <p className="text-sm font-medium text-gray-200">
                      {account.handle}
                    </p>
                    <p className="text-xs text-gray-500">
                      {account.followers} followers
                    </p>
                  </div>
                </div>
                <a
                  href={account.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-accent/10 hover:text-accent-light"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section
        title="Performance Metrics"
        description="Key stats for the current period"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {creator.metrics.map((metric) => {
            const TrendIcon =
              metric.trend === "up" ? TrendingUp : TrendingDown;
            const trendColor =
              metric.trend === "up" ? "text-emerald-400" : "text-red-400";

            return (
              <div
                key={metric.label}
                className="rounded-lg border border-border-subtle bg-surface px-4 py-4"
              >
                <p className="text-xs font-medium text-gray-500">
                  {metric.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {metric.value}
                </p>
                <div
                  className={`mt-1 flex items-center gap-1 text-xs ${trendColor}`}
                >
                  <TrendIcon className="h-3.5 w-3.5" />
                  {metric.change}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section
        title="Sponsorship History"
        description="Past and current brand partnerships"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-gray-400">
                <th className="pb-3 font-medium">Sponsor</th>
                <th className="pb-3 font-medium">Campaign</th>
                <th className="pb-3 font-medium">Value</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Period</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {creator.sponsorshipHistory.map((deal) => (
                <tr key={deal.id}>
                  <td className="py-3 font-medium text-gray-200">
                    {deal.sponsor}
                  </td>
                  <td className="py-3 text-gray-400">{deal.campaign}</td>
                  <td className="py-3 font-medium text-gray-200">
                    {deal.value}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                        deal.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                          : deal.status === "pending"
                            ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                            : "bg-gray-500/10 text-gray-400 ring-gray-500/20"
                      }`}
                    >
                      {deal.status.charAt(0).toUpperCase() +
                        deal.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">
                    {deal.startDate}
                    {deal.endDate ? ` – ${deal.endDate}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Internal Notes" description="Team-only notes and context">
        <div className="rounded-lg border border-border-subtle bg-surface px-4 py-4">
          <p className="text-sm leading-relaxed text-gray-300">
            {creator.internalNotes}
          </p>
        </div>
      </Section>
    </div>
  );
}
