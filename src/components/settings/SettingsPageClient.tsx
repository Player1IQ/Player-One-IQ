"use client";

import Link from "next/link";
import { Bell, CreditCard, Users } from "lucide-react";
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
}: SettingsPageClientProps) {
  if (!canView) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-surface-raised/40">
        <p className="text-sm text-gray-500">
          You do not have permission to view settings.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {currentUserId ? (
        <section className="rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-6 backdrop-blur-sm">
          <h2 className="text-base font-semibold text-white">Your profile</h2>
          <p className="mt-1 text-sm text-gray-500">
            Add a photo so teammates can recognize you across the workspace.
          </p>
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
        <h2 className="text-base font-semibold text-white">Organization</h2>
        <p className="mt-1 text-sm text-gray-500">
          Workspace name and type shown across your dashboard.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/[0.06] bg-surface px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Team members
            </p>
            <p className="mt-1 text-lg font-semibold text-white">{memberCount}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-surface px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Workspace since
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
        <h2 className="text-base font-semibold text-white">Branding</h2>
        <p className="mt-1 text-sm text-gray-500">
          Upload your agency logo for the sidebar and workspace.
        </p>
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
            <h2 className="text-base font-semibold text-white">Team & invites</h2>
            <p className="mt-1 text-sm text-gray-500">
              Invite colleagues and manage roles from the Team page.
            </p>
            <Link
              href="/team"
              className="mt-3 inline-block text-sm font-medium text-accent-light hover:text-white"
            >
              Open Team settings
            </Link>
          </div>
        </div>
      </section>

      {payoutSettings}

      {platformSync}

      <section className="rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-6 backdrop-blur-sm">
        <h2 className="text-base font-semibold text-white">Getting started</h2>
        <p className="mt-1 text-sm text-gray-500">
          Re-run setup and the in-portal guided walkthrough without signing up again.
        </p>
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
              Billing & subscription
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              View your plan, usage limits, and upgrade options.
            </p>
            <Link
              href="/billing"
              className="mt-3 inline-block text-sm font-medium text-accent-light hover:text-white"
            >
              Open Billing
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-6 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <Bell className="mt-0.5 h-5 w-5 text-accent-light" />
          <div>
            <h2 className="text-base font-semibold text-white">Notifications</h2>
            <p className="mt-1 text-sm text-gray-500">
              New message toasts appear in the bottom-right while you work in the
              dashboard. Unread counts update in the sidebar automatically.
            </p>
          </div>
        </div>
      </section>

      {showDevTools && devTools ? (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Development
          </h2>
          <div className="mt-4">{devTools}</div>
        </section>
      ) : null}
    </div>
  );
}
