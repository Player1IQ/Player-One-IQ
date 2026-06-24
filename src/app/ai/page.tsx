import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AiConnectionStrip } from "@/components/ai/AiConnectionStrip";
import { AiDashboardClient } from "@/components/ai/AiDashboardClient";
import { AiModeNotice } from "@/components/ai/AiModeNotice";
import { SubscriptionBanner } from "@/components/subscription/SubscriptionBanner";
import { getAiIntegrationPublicSummary } from "@/lib/ai/credentials";
import { getAiDashboardData } from "@/lib/ai/queries";
import { getAiLlmHealth } from "@/lib/ai/llm-health";
import { getOrganizationId } from "@/lib/organization/queries";
import {
  canManageSettings,
  canViewAi,
  getCurrentUserRole,
} from "@/lib/permissions";
import { hasAnyAiFeature } from "@/lib/subscription/features";
import { getSubscriptionContext } from "@/lib/subscription/queries";

export default async function AiPage() {
  const organizationId = await getOrganizationId();
  const [aiData, context, aiLlmHealth, integration, role] = await Promise.all([
    getAiDashboardData(),
    getSubscriptionContext(),
    getAiLlmHealth(organizationId),
    getAiIntegrationPublicSummary(),
    getCurrentUserRole(),
  ]);

  if (!canViewAi(role)) {
    redirect("/");
  }

  const canManage = canManageSettings(role);

  const aiRequestCount =
    context.usage.find((row) => row.metricKey === "ai_requests")?.count ?? 0;
  const aiRequestLimit = context.limits.ai_requests ?? null;

  return (
    <DashboardLayout
      title="AI Assistants"
      description="Growth, sponsorship, and revenue intelligence for your workspace"
    >
      {hasAnyAiFeature(context.features) ? (
        <SubscriptionBanner
          planName={context.subscription?.plan.name}
          planCode={context.subscription?.plan.code}
          tierGroup={context.subscription?.plan.tierGroup}
        />
      ) : null}
      <AiConnectionStrip
        integration={integration}
        healthState={aiLlmHealth}
        canManage={canManage}
      />
      <AiModeNotice
        healthState={aiLlmHealth}
        aiRequestCount={aiRequestCount}
        aiRequestLimit={aiRequestLimit}
      />
      <AiDashboardClient
        features={Array.from(context.features)}
        usage={aiData.usage}
        aiRequestCount={aiRequestCount}
        aiRequestLimit={aiRequestLimit}
      />
    </DashboardLayout>
  );
}
