"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { CreditCard, Globe, Users } from "lucide-react";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { ReplayOnboardingButton } from "@/components/onboarding/ReplayOnboardingButton";
import { ReplayPortalTourButton } from "@/components/onboarding/ReplayPortalTourButton";
import { OrganizationSettingsForm } from "./OrganizationSettingsForm";
import { OrganizationLogoUpload } from "./OrganizationLogoUpload";
import { ProfilePhotoUpload } from "@/components/account/ProfilePhotoUpload";

interface SettingsPageClientProps {
  organizationId: string;
  organizationName: string;
  organizationType: string;
  organizationLogoUrl?: string | null;
  memberCount: number;
  createdAtDisplay: string;
  canEdit: boolean;
  canView: boolean;
  showDevTools: boolean;
  currentUserId?: string;
  currentUserEmail?: string;
  currentUserAvatarUrl?: string | null;
  devTools?: React.ReactNode;
  platformSync?: React.ReactNode;
  payoutSettings?: React.ReactNode;
  notificationPreferences?: React.ReactNode;
}

export function SettingsPageClient({
  organizationId,
  organizationName,
  organizationType,
  organizationLogoUrl,
  memberCount,
  createdAtDisplay,
  canEdit,
  canView,
  showDevTools,
  currentUserId,
  currentUserEmail,
  currentUserAvatarUrl,
  devTools,
  platformSync,
  payoutSettings,
  notificationPreferences,
}: SettingsPageClientProps) {
  const tLang = useTranslations("language");
  const t = useTranslations("settings");

  if (!canView) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-surface-raised/40">
        <p className="text-sm text-gray-500">{t("noPermission")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {currentUserId ? (
        <section className="rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-6 backdrop-blur-sm">
          <h2 className="text-base font-semibold text-white">{t("profile.title")}</h2>
          <p className="mt-1 text-sm text-gray-500">{t("profile.description")}</p>
          <div className="mt-6">
            <ProfilePhotoUpload
              userId={currentUserId}
              displayName={currentUserEmail ?? organizationName}
              email={currentUserEmail}
              avatarUrl={currentUserAvatarUrl}
            />
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-6 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <Globe className="mt-0.5 h-5 w-5 text-accent-light" />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-white">
              {tLang("settingsTitle")}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {tLang("settingsDescription")}
            </p>
            <LanguageSwitcher className="mt-4" />
            <p className="mt-3 text-xs text-gray-600">{tLang("rolloutNote")}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-6 backdrop-blur-sm">
        <h2 className="text-base font-semibold text-white">{t("organization.title")}</h2>
        <p className="mt-1 text-sm text-gray-500">{t("organization.description")}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/[0.06] bg-surface px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              {t("organization.teamMembers")}
            </p>
            <p className="mt-1 text-lg font-semibold text-white">{memberCount}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-surface px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              {t("organization.workspaceSince")}
            </p>
            <p className="mt-1 text-lg font-semibold text-white">
              {createdAtDisplay}
            </p>
          </div>
        </div>
        <div className="mt-6">
          <OrganizationSettingsForm
            initialName={organizationName}
            initialType={organizationType}
            canEdit={canEdit}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-6 backdrop-blur-sm">
        <h2 className="text-base font-semibold text-white">{t("branding.title")}</h2>
        <p className="mt-1 text-sm text-gray-500">{t("branding.description")}</p>
        <div className="mt-6">
          <OrganizationLogoUpload
            organizationId={organizationId}
            organizationName={organizationName}
            logoUrl={organizationLogoUrl}
            canEdit={canEdit}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-6 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <Users className="mt-0.5 h-5 w-5 text-accent-light" />
          <div>
            <h2 className="text-base font-semibold text-white">{t("teamInvites.title")}</h2>
            <p className="mt-1 text-sm text-gray-500">{t("teamInvites.description")}</p>
            <Link
              href="/team"
              className="mt-3 inline-block text-sm font-medium text-accent-light hover:text-white"
            >
              {t("teamInvites.openTeamSettings")}
            </Link>
          </div>
        </div>
      </section>

      {payoutSettings}

      {platformSync}

      <section className="rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-6 backdrop-blur-sm">
        <h2 className="text-base font-semibold text-white">{t("gettingStarted.title")}</h2>
        <p className="mt-1 text-sm text-gray-500">{t("gettingStarted.description")}</p>
        <div className="mt-4 space-y-3">
          <ReplayOnboardingButton variant="inline" />
          <ReplayPortalTourButton />
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-6 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <CreditCard className="mt-0.5 h-5 w-5 text-accent-light" />
          <div>
            <h2 className="text-base font-semibold text-white">
              {t("billing.title")}
            </h2>
            <p className="mt-1 text-sm text-gray-500">{t("billing.description")}</p>
            <Link
              href="/billing"
              className="mt-3 inline-block text-sm font-medium text-accent-light hover:text-white"
            >
              {t("billing.openBilling")}
            </Link>
          </div>
        </div>
      </section>

      {notificationPreferences}

      {showDevTools && devTools ? (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            {t("development.title")}
          </h2>
          <div className="mt-4">{devTools}</div>
        </section>
      ) : null}
    </div>
  );
}
