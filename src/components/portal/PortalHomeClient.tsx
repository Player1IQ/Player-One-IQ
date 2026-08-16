"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { BrandLogo } from "@/components/brand/BrandLogo";
import type { PortalDeliverableMetrics } from "@/lib/contract-deliverables/queries";
import {
  Briefcase,
  Calendar,
  CheckSquare,
  FileText,
  MessageSquare,
  Target,
  User,
} from "lucide-react";
import type { Creator } from "@/lib/creators";
import type { Contract } from "@/lib/contracts";
import { countActiveDeals } from "@/lib/contracts/deal-metrics";
import { PresencePicker } from "@/components/presence/PresencePicker";
import { CreatorAvatar } from "@/components/creators/CreatorAvatar";
import { ConnectedPlatformBadges } from "@/components/creators/ConnectedPlatformBadges";
import { ContractStatusBadge } from "@/components/contracts/ContractStatusBadge";
import { PresenceBadge } from "@/components/presence/PresenceBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { PortalAlertsBanner } from "@/components/portal/PortalAlertsBanner";
import { PortalGrowthPanel } from "@/components/portal/PortalGrowthPanel";
import { PortalEarningsCard } from "@/components/portal/PortalEarningsCard";
import { PortalApplicationsPanel } from "@/components/portal/PortalApplicationsPanel";
import { PortalMarketplaceSpotlight } from "@/components/portal/PortalMarketplaceSpotlight";
import { PortalRecommendedOpportunities } from "@/components/portal/PortalRecommendedOpportunities";
import { PortalProfileReadiness } from "@/components/portal/PortalProfileReadiness";
import { TodayScheduleCard } from "@/components/schedule/TodayScheduleCard";
import type { CreatorPlatformSummary } from "@/lib/creators/platform-summary";
import type { CreatorPortalBenefits } from "@/lib/creators/portal-benefits";
import type { ScheduleEvent } from "@/lib/schedule";
import type { CoachContext, CreatorCoachSnapshot } from "@/lib/creator-coach/types";
import type { CoachProfile } from "@/lib/creator-coach/profile-types";
import type { CreatorSeasonView } from "@/lib/creator-seasons/types";
import { CreatorCoachPanel } from "@/components/creator-coach";
import { CreatorSeasonCard } from "@/components/creator-seasons";

interface PortalHomeClientProps {
  creator: Creator;
  contracts: Contract[];
  unreadMessages: number;
  organizationName: string;
  organizationLogoUrl?: string | null;
  whiteLabelEnabled?: boolean;
  roleLabel: string;
  showCampaigns: boolean;
  campaignCount: number;
  showOpportunities?: boolean;
  openOpportunityCount?: number;
  pendingApplicationCount?: number;
  deliverableMetrics: PortalDeliverableMetrics;
  platformSummary?: CreatorPlatformSummary | null;
  portalBenefits?: CreatorPortalBenefits | null;
  todaySchedule?: ScheduleEvent[];
  coachSnapshot?: CreatorCoachSnapshot | null;
  coachContext?: CoachContext | null;
  coachProfile?: CoachProfile | null;
  creatorId?: string | null;
  seasonView?: CreatorSeasonView | null;
}

export function PortalHomeClient({
  creator,
  contracts,
  unreadMessages,
  organizationName,
  organizationLogoUrl,
  whiteLabelEnabled = false,
  roleLabel,
  showCampaigns,
  campaignCount,
  showOpportunities = false,
  openOpportunityCount = 0,
  pendingApplicationCount = 0,
  deliverableMetrics,
  platformSummary = null,
  portalBenefits = null,
  todaySchedule = [],
  coachSnapshot = null,
  coachContext = null,
  coachProfile = null,
  creatorId = null,
  seasonView = null,
}: PortalHomeClientProps) {
  const t = useTranslations("portal.home");
  const activeDealCount = countActiveDeals(contracts);

  return (
    <div className="space-y-6 animate-fade-in">
      <div
        className="relative overflow-hidden rounded-2xl border border-white/[0.06]"
        data-tour-spot="portal-home-hero"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 via-surface-raised to-surface" />
        <div className="relative flex flex-col gap-5 px-6 py-8 sm:flex-row sm:items-center sm:px-8">
          {organizationLogoUrl ? (
            <img
              src={organizationLogoUrl}
              alt={`${organizationName} logo`}
              className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-1 ring-white/10"
            />
          ) : (
            <CreatorAvatar
              name={creator.name}
              imageUrl={creator.avatarUrl}
              initials={creator.avatarInitials}
              color={creator.avatarColor}
              size="lg"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {organizationName} · {roleLabel}
            </p>
            <h2 className="mt-1 text-3xl font-bold text-white">{creator.name}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <PresenceBadge status={creator.availabilityStatus} size="md" />
              <ConnectedPlatformBadges
                platforms={
                  platformSummary?.platforms.map((account) => account.platform) ??
                  []
                }
                fallbackPlatform={creator.primaryPlatform}
              />
            </div>
          </div>
          <Link
            href={`/creators/${creator.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:border-accent/40 hover:text-accent-light"
          >
            <User className="h-4 w-4" />
            {t("viewFullProfile")}
          </Link>
        </div>
        {!whiteLabelEnabled && organizationLogoUrl ? (
          <div className="relative border-t border-white/[0.04] px-6 py-2 sm:px-8">
            <p className="flex items-center gap-2 text-[10px] text-gray-600">
              <span>{t("poweredBy")}</span>
              <BrandLogo size="xs" className="opacity-70" />
            </p>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <MetricCard
          title={t("openDeliverables")}
          value={String(deliverableMetrics.openCount)}
          subtitle={
            deliverableMetrics.overdueCount > 0
              ? t("overdue", { count: deliverableMetrics.overdueCount })
              : t("acrossDeals")
          }
          href="/portal/deliverables"
          icon={CheckSquare}
          iconColor={
            deliverableMetrics.overdueCount > 0
              ? "text-red-400"
              : "text-amber-400"
          }
        />
        <MetricCard
          title={t("activeDeals")}
          value={String(activeDealCount)}
          subtitle={t("totalDeals", { count: contracts.length })}
          href="/contracts"
          icon={FileText}
          iconColor="text-emerald-400"
        />
        {showCampaigns ? (
          <MetricCard
            title={t("campaigns")}
            value={String(campaignCount)}
            subtitle={
              campaignCount === 1
                ? t("assignedCampaign")
                : t("assignedCampaigns")
            }
            href="/campaigns"
            icon={Target}
            iconColor="text-amber-400"
          />
        ) : null}
        {showOpportunities ? (
          <MetricCard
            title={t("opportunities")}
            value={String(openOpportunityCount)}
            subtitle={
              pendingApplicationCount > 0
                ? t("pendingReview", { count: pendingApplicationCount })
                : t("openToApply")
            }
            href="/opportunities"
            icon={Briefcase}
            iconColor="text-sky-400"
          />
        ) : null}
        <MetricCard
          title={t("messages")}
          value={String(unreadMessages)}
          subtitle={unreadMessages === 1 ? t("unreadConversation") : t("unreadConversations")}
          href="/portal/messages"
          icon={MessageSquare}
          iconColor="text-violet-400"
        />
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {t("availability")}
          </p>
          <div className="mt-3">
            <PresencePicker
              mode="creator"
              creatorId={creator.id}
              initialStatus={creator.availabilityStatus}
            />
          </div>
        </div>
      </div>

      <PortalAlertsBanner
        overdueDeliverables={deliverableMetrics.overdueCount}
        unreadMessages={unreadMessages}
        acceptedApplications={portalBenefits?.applicationStats.accepted ?? 0}
        underReviewApplications={portalBenefits?.applicationStats.underReview ?? 0}
        rejectedApplications={portalBenefits?.applicationStats.rejected ?? 0}
      />

      {coachSnapshot && coachContext ? (
        <CreatorCoachPanel
          snapshot={coachSnapshot}
          coachContext={coachContext}
          coachProfile={coachProfile}
          creatorId={creatorId}
        />
      ) : null}

      {seasonView && creatorId ? (
        <CreatorSeasonCard seasonView={seasonView} creatorId={creatorId} />
      ) : null}

      {portalBenefits && portalBenefits.profileReadiness.score < 100 ? (
        <PortalProfileReadiness readiness={portalBenefits.profileReadiness} />
      ) : null}

      <TodayScheduleCard
        events={todaySchedule}
        description={t("scheduleDescription")}
      />

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
                  {t("nextDeliverableDue")}
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
                  {t("dueDate", { date: deliverableMetrics.nextDue.dueDateDisplay })}
                </p>
              </div>
            </div>
            <Link
              href={`/contracts/${deliverableMetrics.nextDue.contractId}`}
              className="text-sm font-medium text-accent-light hover:text-white"
            >
              {t("viewDeal")}
            </Link>
            <Link
              href="/portal/deliverables"
              className="text-sm font-medium text-gray-400 hover:text-white"
            >
              {t("allDeliverables")}
            </Link>
          </div>
        </div>
      ) : null}

      {platformSummary ? (
        <PortalGrowthPanel creatorId={creator.id} summary={platformSummary} />
      ) : null}

      {portalBenefits ? (
        <PortalEarningsCard
          summary={portalBenefits.revenueSummary}
        />
      ) : null}

      {showOpportunities && portalBenefits ? (
        <PortalApplicationsPanel
          applications={portalBenefits.recentApplications}
        />
      ) : null}

      {showOpportunities && portalBenefits ? (
        <PortalRecommendedOpportunities
          opportunities={portalBenefits.recommendedOpportunities}
        />
      ) : null}

      {showOpportunities && portalBenefits ? (
        <PortalMarketplaceSpotlight
          opportunities={portalBenefits.marketplaceOpportunities}
          marketplaceCount={portalBenefits.marketplaceCount}
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Card>
          <CardHeader>
            <CardTitle>{t("yourDeals")}</CardTitle>
            <CardDescription>{t("yourDealsDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {contracts.length === 0 ? (
              <p className="text-sm text-gray-500">{t("noDealsYet")}</p>
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
                className="mt-4 inline-flex text-sm font-medium text-accent-light hover:text-white"
              >
                {t("viewAllDeals")}
              </Link>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("quickLinks")}</CardTitle>
            <CardDescription>{t("quickLinksDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <Link
              href={`/creators/${creator.id}`}
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] px-4 py-3 text-sm text-gray-300 transition-colors hover:border-accent/20 hover:text-white"
            >
              <User className="h-4 w-4 text-accent-light" />
              {t("myProfile")}
            </Link>
            <Link
              href="/portal/messages"
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] px-4 py-3 text-sm text-gray-300 transition-colors hover:border-accent/20 hover:text-white"
            >
              <MessageSquare className="h-4 w-4 text-accent-light" />
              {t("messages")}
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
                <span className="flex-1">{t("campaigns")}</span>
                {campaignCount > 0 ? (
                  <span className="text-xs text-gray-500">
                    {t("assigned", { count: campaignCount })}
                  </span>
                ) : null}
              </Link>
            ) : null}
            {showOpportunities ? (
              <Link
                href="/opportunities/applications"
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] px-4 py-3 text-sm text-gray-300 transition-colors hover:border-accent/20 hover:text-white"
              >
                <Briefcase className="h-4 w-4 text-accent-light" />
                <span className="flex-1">{t("myApplications")}</span>
                {portalBenefits && portalBenefits.applicationStats.total > 0 ? (
                  <span className="text-xs text-gray-500">
                    {t("submitted", { count: portalBenefits.applicationStats.total })}
                  </span>
                ) : null}
              </Link>
            ) : null}
            {showOpportunities ? (
              <Link
                href="/opportunities"
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] px-4 py-3 text-sm text-gray-300 transition-colors hover:border-accent/20 hover:text-white"
              >
                <Briefcase className="h-4 w-4 text-accent-light" />
                <span className="flex-1">{t("opportunities")}</span>
                {openOpportunityCount > 0 ? (
                  <span className="text-xs text-gray-500">
                    {t("open", { count: openOpportunityCount })}
                  </span>
                ) : null}
              </Link>
            ) : null}
            <Link
              href="/portal/account"
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] px-4 py-3 text-sm text-gray-300 transition-colors hover:border-accent/20 hover:text-white"
            >
              <Briefcase className="h-4 w-4 text-accent-light" />
              {t("account")}
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
