import { DashboardLayout } from "@/components/DashboardLayout";
import { SeedTestDataButton } from "@/components/dev/SeedTestDataButton";
import { DeployChecklistCard } from "@/components/settings/DeployChecklistCard";
import { PlatformSyncCard } from "@/components/settings/PlatformSyncCard";
import { SettingsPageClient } from "@/components/settings/SettingsPageClient";
import { AiIntegrationCard } from "@/components/settings/AiIntegrationCard";
import { getAiIntegrationForSettings } from "@/lib/ai/credentials";
import { isAiCredentialsEncryptionConfigured } from "@/lib/ai/credentials-crypto";
import { isPlatformOAuthFeatureEnabled } from "@/lib/platform-oauth/config";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
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

async function getOAuthConnectedAccountCount(): Promise<number> {
  const organizationId = await getOrganizationId();
  if (!organizationId) return 0;

  const supabase = await createClient();
  if (!supabase) return 0;

  const { count } = await supabase
    .from("creator_platform_accounts")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("connection_status", "connected_oauth");

  return count ?? 0;
}

export default async function SettingsPage() {
  const [organization, role, memberCount, oauthConnectedCount] =
    await Promise.all([
      getOrganizationForUser(),
      getCurrentUserRole(),
      getOrganizationMemberCount(),
      getOAuthConnectedAccountCount(),
    ]);

  const canView = canViewSettings(role);
  const canEdit = canManageSettings(role);
  const aiIntegration = canView ? await getAiIntegrationForSettings() : null;
  const showDevTools = isSeedEnabled();
  const oauthEnabled = isPlatformOAuthFeatureEnabled();

  return (
    <DashboardLayout
      title="Settings"
      description="Configure your workspace preferences"
    >
      <SettingsPageClient
        organizationId={organization?.id ?? ""}
        organizationName={organization?.name ?? ""}
        organizationType={organization?.type ?? ""}
        organizationLogoUrl={organization?.logo_url ?? null}
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
        platformSync={
          canView ? (
            <>
              <DeployChecklistCard
                aiIntegrationHasKey={aiIntegration?.hasApiKey ?? false}
                aiIntegrationProbeError={aiIntegration?.lastProbeError ?? null}
              />
              <AiIntegrationCard
                integration={aiIntegration}
                encryptionConfigured={isAiCredentialsEncryptionConfigured()}
                platformFallbackConfigured={Boolean(
                  process.env.OPENAI_API_KEY?.trim()
                )}
                canManage={canEdit}
              />
              <PlatformSyncCard
                oauthEnabled={oauthEnabled}
                connectedCount={oauthConnectedCount}
                canManage={canEdit}
              />
            </>
          ) : undefined
        }
      />
    </DashboardLayout>
  );
}
