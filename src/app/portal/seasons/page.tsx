import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CreatorSeasonPanel } from "@/components/creator-seasons";
import { getCurrentUserId } from "@/lib/creator-coach/service";
import { getAllCoachStatesForToday } from "@/lib/creator-coach/queries";
import { getCoachProfile } from "@/lib/creator-coach/profile-queries";
import {
  buildCreatorSeasonView,
  syncCreatorSeasonXpFromCoach,
} from "@/lib/creator-seasons";
import { requireCreatorPortalUser } from "@/lib/portal/guard";

export default async function PortalSeasonsPage() {
  const t = await getTranslations("pages.portalSeasons");
  const tPortal = await getTranslations("portal.seasons");
  const { linkedCreatorId } = await requireCreatorPortalUser();
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/login");
  }

  const [states, coachProfile] = await Promise.all([
    getAllCoachStatesForToday(userId, linkedCreatorId),
    getCoachProfile(userId, linkedCreatorId),
  ]);

  await syncCreatorSeasonXpFromCoach({
    userId,
    creatorId: linkedCreatorId,
    missions: states.map((state) => ({
      mission: state.mission,
      stateId: state.id,
    })),
    completedRecommendations: states.flatMap((state) =>
      state.completedRecommendationIds.map((recommendationId) => ({
        recommendationId,
        stateId: state.id,
        missionDate: state.missionDate,
      }))
    ),
    coachOnboardingCompleted: coachProfile?.onboardingCompleted ?? false,
  });

  const seasonView = await buildCreatorSeasonView(userId, linkedCreatorId);
  if (!seasonView) {
    return (
      <DashboardLayout title={t("title")} description={t("description")}>
        <div className="rounded-2xl border border-white/[0.06] bg-surface-raised/50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-gray-300">{tPortal("noActiveTitle")}</p>
          <p className="mt-1 text-sm text-gray-500">{tPortal("noActiveDescription")}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={t("title")} description={t("description")}>
      <CreatorSeasonPanel
        seasonView={seasonView}
        creatorId={linkedCreatorId}
      />
    </DashboardLayout>
  );
}
