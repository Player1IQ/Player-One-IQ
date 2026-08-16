import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PortalCoachLayout } from "@/components/creator-ai/PortalCoachLayout";
import { listCreatorAiConversations } from "@/lib/creator-ai/queries";
import { CREATOR_AI_COACH_FEATURE } from "@/lib/creator-ai/permissions";
import { getCurrentUserId } from "@/lib/creator-coach/service";
import { requireCreatorPortalUser } from "@/lib/portal/guard";
import { loadPortalCoachPageData } from "@/lib/portal/coach-page-data";
import { hasFeature } from "@/lib/subscription/features";
import { getSubscriptionContext } from "@/lib/subscription/queries";

export default async function PortalCoachPage() {
  const t = await getTranslations("pages.portalCoach");
  const tPortal = await getTranslations("portal.coach");
  const tLayout = await getTranslations("coach.layout");
  const { linkedCreatorId } = await requireCreatorPortalUser();
  const [data, subscription, userId] = await Promise.all([
    loadPortalCoachPageData(linkedCreatorId),
    getSubscriptionContext(),
    getCurrentUserId(),
  ]);

  if (!data) {
    redirect("/portal");
  }

  const hasAiCoachChat = hasFeature(subscription.features, CREATOR_AI_COACH_FEATURE);

  const initialConversations =
    hasAiCoachChat && userId
      ? await listCreatorAiConversations(userId, linkedCreatorId)
      : [];

  return (
    <DashboardLayout title={t("title")} description={tPortal("pageDescription")}>
      {data.coachSnapshot ? (
        <PortalCoachLayout
          snapshot={data.coachSnapshot}
          coachContext={data.coachContext}
          coachProfile={data.coachProfile}
          creatorId={data.creatorId}
          hasAiCoachChat={hasAiCoachChat}
          initialConversations={initialConversations}
        />
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-surface-raised/50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-gray-300">
            {tLayout("unavailableTitle")}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {tLayout("unavailableDescription")}
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}
