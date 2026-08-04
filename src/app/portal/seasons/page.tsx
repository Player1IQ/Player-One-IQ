import { redirect } from "next/navigation";
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
      <DashboardLayout
        title="Seasons"
        description="Creator season progression"
      >
        <div className="rounded-2xl border border-white/[0.06] bg-surface-raised/50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-gray-300">No active season</p>
          <p className="mt-1 text-sm text-gray-500">
            Check back soon for the next Creator Season.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Seasons"
      description="Earn XP from Coach recommendations and unlock tier rewards"
    >
      <CreatorSeasonPanel
        seasonView={seasonView}
        creatorId={linkedCreatorId}
      />
    </DashboardLayout>
  );
}
