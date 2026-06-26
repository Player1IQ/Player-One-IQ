import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SeedTestDataButton } from "@/components/dev/SeedTestDataButton";
import { DeployChecklistCard } from "@/components/settings/DeployChecklistCard";
import { PlatformSyncCard } from "@/components/settings/PlatformSyncCard";
import { SettingsPageClient } from "@/components/settings/SettingsPageClient";
import { AiIntegrationCard } from "@/components/settings/AiIntegrationCard";
import { ApiAccessCard } from "@/components/settings/ApiAccessCard";
import { WebhookEndpointsCard } from "@/components/settings/WebhookEndpointsCard";
import { getOrganizationApiKeysForSettings } from "@/lib/api/key-management";
import { getOrganizationWebhooksForSettings } from "@/lib/api/webhook-management";
import { hasFeature } from "@/lib/subscription/features";
import { getSubscriptionContext } from "@/lib/subscription/queries";
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
import { getCreators } from "@/lib/creators/queries";
import { getPayoutRecipientsForOrg } from "@/lib/payments/queries";
import { PayoutSettingsSection } from "@/components/payments/PayoutSettingsSection";

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
  const [organization, role, memberCount, oauthConnectedCount, payoutRecipients, creators] =
    await Promise.all([
      getOrganizationForUser(),
      getCurrentUserRole(),
      getOrganizationMemberCount(),
      getOAuthConnectedAccountCount(),
      getPayoutRecipientsForOrg(),
      getCreators(),
    ]);

  const canView = canViewSettings(role);
  const canEdit = canManageSettings(role);

  if (!canView) {
    redirect("/");
  }

  const aiIntegration = await getAiIntegrationForSettings();
  const subscriptionContext = await getSubscriptionContext();
  const hasApiAccess = hasFeature(subscriptionContext.features, "api_access");
  const apiKeys =
    hasApiAccess && canEdit ? await getOrganizationApiKeysForSettings() : [];
  const webhooks =
    hasApiAccess && canEdit ? await getOrganizationWebhooksForSettings() : [];
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  const showDevTools = isSeedEnabled();
  const oauthEnabled = isPlatformOAuthFeatureEnabled();
  const orgRecipient =
    payoutRecipients.find((r) => r.recipientType === "organization") ?? null;
  const creatorRecipients = payoutRecipients.filter(
    (r) => r.recipientType === "creator"
  );

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
        payoutSettings={
          canView ? (
            <PayoutSettingsSection
              orgRecipient={orgRecipient}
              creatorRecipients={creatorRecipients}
              creators={creators}
              canEdit={canEdit}
            />
          ) : undefined
        }
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
              {hasApiAccess && canEdit ? (
                <>
                  <ApiAccessCard
                    apiKeys={apiKeys}
                    appUrl={appUrl}
                    canManage={canEdit}
                  />
                  <WebhookEndpointsCard
                    webhooks={webhooks}
                    canManage={canEdit}
                  />
                </>
              ) : null}
            </>
          ) : undefined
        }
      />
    </DashboardLayout>
  );
}
