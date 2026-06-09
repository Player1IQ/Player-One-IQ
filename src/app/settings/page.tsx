import { DashboardLayout } from "@/components/DashboardLayout";
import { SeedTestDataButton } from "@/components/dev/SeedTestDataButton";
import { SettingsPageClient } from "@/components/settings/SettingsPageClient";
import {
  getOrganizationForUser,
  getOrganizationMemberCount,
} from "@/lib/organization/queries";
import {
  canManageSettings,
  canViewSettings,
  getCurrentUserRole,
} from "@/lib/permissions";
import { isSeedEnabled } from "@/lib/seed/constants";

function formatCreatedAt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function SettingsPage() {
  const [organization, role, memberCount] = await Promise.all([
    getOrganizationForUser(),
    getCurrentUserRole(),
    getOrganizationMemberCount(),
  ]);

  const canView = canViewSettings(role);
  const canEdit = canManageSettings(role);
  const showDevTools = isSeedEnabled();

  return (
    <DashboardLayout
      title="Settings"
      description="Configure your workspace preferences"
    >
      <SettingsPageClient
        organizationName={organization?.name ?? ""}
        organizationType={organization?.type ?? ""}
        memberCount={memberCount}
        createdAtDisplay={
          organization?.created_at
            ? formatCreatedAt(organization.created_at)
            : "—"
        }
        canEdit={canEdit}
        canView={canView}
        showDevTools={showDevTools}
        devTools={
          showDevTools ? <SeedTestDataButton variant="card" /> : undefined
        }
      />
    </DashboardLayout>
  );
}
