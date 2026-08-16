"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  Globe,
  Shield,
  Sparkles,
  User,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { ReplayOnboardingButton } from "@/components/onboarding/ReplayOnboardingButton";
import { ReplayPortalTourButton } from "@/components/onboarding/ReplayPortalTourButton";
import { ProfilePhotoUpload } from "@/components/account/ProfilePhotoUpload";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

interface PortalAccountClientProps {
  organizationName: string;
  roleLabel: string;
  email: string;
  profileLabel: string;
  profileHref: string;
  userId: string;
  avatarUrl?: string | null;
  isWorkspaceFounder?: boolean;
}

export function PortalAccountClient({
  organizationName,
  roleLabel,
  email,
  profileLabel,
  profileHref,
  userId,
  avatarUrl,
  isWorkspaceFounder = false,
}: PortalAccountClientProps) {
  const tLang = useTranslations("language");
  const t = useTranslations("portal.account");

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <Link
        href="/portal"
        className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-accent-light"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToPortal")}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{t("profileTitle")}</CardTitle>
          <CardDescription>{t("profileDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <ProfilePhotoUpload
            userId={userId}
            displayName={email}
            email={email}
            avatarUrl={avatarUrl}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-accent-light" />
            {tLang("portalTitle")}
          </CardTitle>
          <CardDescription>{tLang("portalDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <LanguageSwitcher />
          <p className="mt-3 text-xs text-gray-600">{tLang("rolloutNote")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("accountTitle")}</CardTitle>
          <CardDescription>
            {isWorkspaceFounder
              ? t("accountDescriptionFounder")
              : t("accountDescriptionManaged", { organizationName })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-gray-500">{t("signedInAs")}</p>
            <p className="mt-1 text-sm font-medium text-white">{email}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500">
                <Building2 className="h-3.5 w-3.5" />
                {t("organization")}
              </div>
              <p className="mt-1 text-sm font-medium text-white">{organizationName}</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500">
                <Shield className="h-3.5 w-3.5" />
                {t("role")}
              </div>
              <p className="mt-1 text-sm font-medium text-white">{roleLabel}</p>
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500">
              <User className="h-3.5 w-3.5" />
              {t("linkedProfile")}
            </div>
            <Link
              href={profileHref}
              className="mt-1 inline-flex text-sm font-medium text-accent-light hover:text-white"
            >
              {profileLabel}
            </Link>
          </div>
        </CardContent>
      </Card>

      {isWorkspaceFounder ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("workspaceTitle")}</CardTitle>
            <CardDescription>{t("workspaceDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 pt-0 sm:grid-cols-2">
            <Link
              href="/settings#ai-integration"
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4 transition hover:border-accent/30 hover:bg-accent/5"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Sparkles className="h-4 w-4 text-accent-light" />
                {t("aiIntegration")}
              </div>
              <p className="mt-2 text-xs text-gray-500">{t("aiIntegrationDescription")}</p>
            </Link>
            <Link
              href="/billing"
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4 transition hover:border-accent/30 hover:bg-accent/5"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <CreditCard className="h-4 w-4 text-accent-light" />
                {t("billing")}
              </div>
              <p className="mt-2 text-xs text-gray-500">{t("billingDescription")}</p>
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <ReplayOnboardingButton />
      <ReplayPortalTourButton />
    </div>
  );
}
