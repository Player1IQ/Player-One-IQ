"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Pencil,
  Trash2,
  Users,
  TrendingUp,
  DollarSign,
  Award,
  BarChart3,
} from "lucide-react";
import type { Creator } from "@/lib/creators";
import type { Contract } from "@/lib/contracts";
import { RelatedContractsSection } from "@/components/contracts/RelatedContractsSection";
import { formatCreatorDate } from "@/lib/creators";
import { deleteCreator } from "@/app/creators/actions";
import { CreatorAvatar } from "./CreatorAvatar";
import { StatusBadge } from "./StatusBadge";
import { PlatformBadge } from "./PlatformBadge";
import { CreatorFormModal } from "./CreatorFormModal";
import { CreatorPlatformAccounts } from "./CreatorPlatformAccounts";
import { CreatorIncomeOverview } from "./CreatorIncomeOverview";
import type { CreatorPlatformAccount, CreatorRevenueEntry } from "@/lib/creator-revenue";
import {
  platformOAuthDescription,
  type OAuthPlatformUi,
} from "@/lib/platform-oauth/config";
import { CreatorOAuthBanner } from "./CreatorOAuthBanner";
import { CreatorContentCoach } from "./CreatorContentCoach";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";

interface CreatorProfileProps {
  creator: Creator;
  contracts?: Contract[];
  platformAccounts?: CreatorPlatformAccount[];
  revenueEntries?: CreatorRevenueEntry[];
  oauthPlatformUi?: OAuthPlatformUi[];
  oauthSuccess?: string | null;
  oauthError?: string | null;
  canWrite?: boolean;
  canUseContentAi?: boolean;
  aiMode?: "live" | "demo";
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

export function CreatorProfile({
  creator,
  contracts = [],
  platformAccounts = [],
  revenueEntries = [],
  oauthPlatformUi = [],
  oauthSuccess = null,
  oauthError = null,
  canWrite = true,
  canUseContentAi = false,
  aiMode = "demo",
}: CreatorProfileProps) {
  const connectedOAuthPlatforms = platformAccounts
    .filter((account) => account.connectionStatus === "connected_oauth")
    .map((account) => account.platform);
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        `Remove ${creator.name} from your roster? This cannot be undone.`
      )
    ) {
      return;
    }
    setDeleting(true);
    const result = await deleteCreator(creator.id);
    if ("error" in result && result.error) {
      alert(result.error);
      setDeleting(false);
      return;
    }
    router.push("/creators");
    router.refresh();
  }

  const primaryHandle = creator.socialHandles.find(
    (h) => h.platform === creator.primaryPlatform
  );

  const activeContracts = contracts.filter((c) => c.status === "active");
  const totalContractValue = contracts.reduce(
    (sum, c) => sum + c.contractValue,
    0
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <CreatorOAuthBanner success={oauthSuccess} error={oauthError} />

      <div className="flex items-center justify-between">
        <Link
          href="/creators"
          className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-accent-light"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Creators
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
              {deleting ? "Removing..." : "Remove"}
            </Button>
          </div>
        )}
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06]">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-surface-raised to-surface" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="relative px-6 pb-6 pt-8 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <CreatorAvatar
              initials={creator.avatarInitials}
              color={creator.avatarColor}
              size="lg"
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-3xl font-bold text-white">{creator.name}</h2>
                <StatusBadge status={creator.status} />
              </div>
              {primaryHandle && (
                <p className="mt-1 text-accent-light">{primaryHandle.handle}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <PlatformBadge platform={creator.primaryPlatform} />
                {creator.socialHandles
                  .filter((h) => h.platform !== creator.primaryPlatform)
                  .map((h, i) => (
                    <PlatformBadge key={`${h.platform}-${i}`} platform={h.platform} />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Contracts"
          value={String(activeContracts.length)}
          subtitle={`${contracts.length} total`}
          icon={DollarSign}
          iconColor="bg-accent/10 text-accent-light ring-accent/20"
        />
        <MetricCard
          title="Contract Value"
          value={
            totalContractValue > 0
              ? `$${totalContractValue.toLocaleString()}`
              : "—"
          }
          subtitle="Total pipeline value"
          icon={TrendingUp}
          iconColor="bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
        />
        <MetricCard
          title="Platforms"
          value={String(platformAccounts.length)}
          subtitle={`${connectedOAuthPlatforms.length} OAuth connected`}
          icon={Users}
          iconColor="bg-violet-500/10 text-violet-400 ring-violet-500/20"
        />
        <MetricCard
          title="Member Since"
          value={formatCreatorDate(creator.createdAt).split(",")[0] ?? "—"}
          subtitle="On your roster"
          icon={Award}
          iconColor="bg-amber-500/10 text-amber-400 ring-amber-500/20"
        />
      </div>

      {/* Audience chart placeholder */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent-light" />
            <CardTitle>Audience & Growth</CardTitle>
          </div>
          <CardDescription>
            Connect platform accounts to see audience analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {platformAccounts.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02]">
              <p className="text-sm text-gray-500">
                No platform data available — connect accounts below
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {platformAccounts.map((account) => (
                <div
                  key={account.id}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {account.platform}
                  </p>
                  <p className="mt-2 text-lg font-bold text-white capitalize">
                    {account.connectionStatus.replace(/_/g, " ")}
                  </p>
                  <Badge variant="accent" className="mt-2">
                    Connected
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Creator Information">
          <dl className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <dt className="text-xs text-gray-500">Email</dt>
                <dd className="text-sm text-gray-200">
                  {creator.email ?? "—"}
                </dd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <dt className="text-xs text-gray-500">Added</dt>
                <dd className="text-sm text-gray-200">
                  {formatCreatorDate(creator.createdAt)}
                </dd>
              </div>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Primary Platform</dt>
              <dd className="mt-1">
                <PlatformBadge platform={creator.primaryPlatform} />
              </dd>
            </div>
          </dl>
        </Section>

        <Section
          title="Social Handles"
          description="Connected platform handles"
        >
          {creator.socialHandles.length === 0 ? (
            <p className="text-sm text-gray-500">No social handles added.</p>
          ) : (
            <ul className="space-y-3">
              {creator.socialHandles.map((handle, i) => (
                <li
                  key={`${handle.platform}-${i}`}
                  className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface px-4 py-3"
                >
                  <PlatformBadge platform={handle.platform} />
                  <p className="text-sm font-medium text-gray-200">
                    {handle.handle}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section
        title="Income Overview"
        description="Combined platform and sponsorship revenue for this month"
      >
        <CreatorIncomeOverview
          contracts={contracts}
          revenueEntries={revenueEntries}
        />
      </Section>

      <Section
        title="AI Content Coach"
        description="Cross-platform recommendations from connected accounts"
      >
        <CreatorContentCoach
          creatorId={creator.id}
          creatorName={creator.name}
          connectedOAuthPlatforms={connectedOAuthPlatforms}
          oauthPlatformUi={oauthPlatformUi}
          canUseAi={canUseContentAi}
          aiMode={aiMode}
        />
      </Section>

      <Section
        title="Connected Platforms"
        description={platformOAuthDescription(oauthPlatformUi)}
      >
        <CreatorPlatformAccounts
          creator={creator}
          accounts={platformAccounts}
          revenueEntries={revenueEntries}
          oauthPlatformUi={oauthPlatformUi}
          canWrite={canWrite}
        />
      </Section>

      <Section
        title="Contracts"
        description="Sponsorship agreements for this creator"
      >
        <RelatedContractsSection
          contracts={contracts}
          emptyMessage="No contracts linked to this creator yet."
        />
      </Section>

      <Section title="Notes" description="Internal notes and context">
        <div className="rounded-lg border border-border-subtle bg-surface px-4 py-4">
          <p className="text-sm leading-relaxed text-gray-300">
            {creator.notes?.trim() || "No notes yet."}
          </p>
        </div>
      </Section>

      <CreatorFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        creator={creator}
      />
    </div>
  );
}
