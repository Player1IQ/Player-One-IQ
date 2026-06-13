import { DashboardLayout } from "@/components/DashboardLayout";
import { AiDashboardClient } from "@/components/ai/AiDashboardClient";
import { AiModeNotice } from "@/components/ai/AiModeNotice";
import { SubscriptionBanner } from "@/components/subscription/SubscriptionBanner";
import { getAiDashboardData } from "@/lib/ai/queries";
import { getOpenAiHealth } from "@/lib/ai/openai-health";
import { hasAnyAiFeature } from "@/lib/subscription/features";
import { getSubscriptionContext } from "@/lib/subscription/queries";

export default async function AiPage() {
  const [aiData, context, openAiHealth] = await Promise.all([
    getAiDashboardData(),
    getSubscriptionContext(),
    getOpenAiHealth(),
  ]);

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
      <AiModeNotice
        health={openAiHealth}
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
