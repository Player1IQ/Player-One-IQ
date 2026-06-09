"use client";

import Link from "next/link";
import { Bell, Users } from "lucide-react";
import { OrganizationSettingsForm } from "./OrganizationSettingsForm";

interface SettingsPageClientProps {
  organizationName: string;
  organizationType: string;
  memberCount: number;
  createdAtDisplay: string;
  canEdit: boolean;
  canView: boolean;
  showDevTools: boolean;
  devTools?: React.ReactNode;
}

export function SettingsPageClient({
  organizationName,
  organizationType,
  memberCount,
  createdAtDisplay,
  canEdit,
  canView,
  showDevTools,
  devTools,
}: SettingsPageClientProps) {
  if (!canView) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-dashed border-border bg-surface-raised">
        <p className="text-sm text-gray-500">
          You do not have permission to view settings.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section className="rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="text-base font-semibold text-white">Organization</h2>
        <p className="mt-1 text-sm text-gray-500">
          Workspace name and type shown across your dashboard.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border-subtle bg-surface px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Team members
            </p>
            <p className="mt-1 text-lg font-semibold text-white">{memberCount}</p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface px-4 py-3">
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

      <section className="rounded-xl border border-border bg-surface-raised p-6">
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

      <section className="rounded-xl border border-border bg-surface-raised p-6">
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
