"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/creator-coach/service";
import { getAllCoachStatesForToday } from "@/lib/creator-coach/queries";
import { getCoachProfile } from "@/lib/creator-coach/profile-queries";
import type { CoachContext, DailyMission } from "@/lib/creator-coach/types";
import {
  awardMissionTaskSeasonXp,
  awardRecommendationSeasonXp,
  syncCreatorSeasonXpFromCoach,
} from "./sync-coach-xp";

export type LocalCoachSeasonSync = {
  mission?: DailyMission | null;
  completedRecommendationIds?: string[];
};

function revalidateSeasonPaths() {
  revalidatePath("/portal");
  revalidatePath("/portal/seasons");
}

export async function syncCreatorSeasonFromCoachAction(
  creatorId: string,
  local?: LocalCoachSeasonSync
): Promise<{ xpAwarded: number }> {
  const userId = await getCurrentUserId();
  if (!userId) return { xpAwarded: 0 };

  const [states, coachProfile] = await Promise.all([
    getAllCoachStatesForToday(userId, creatorId),
    getCoachProfile(userId, creatorId),
  ]);

  const missions: Array<{ mission: DailyMission; stateId: string | null }> =
    states.map((state) => ({
      mission: state.mission,
      stateId: state.id,
    }));

  if (local?.mission) {
    missions.push({ mission: local.mission, stateId: null });
  }

  const completedRecommendations = [
    ...states.flatMap((state) =>
      state.completedRecommendationIds.map((recommendationId) => ({
        recommendationId,
        stateId: state.id,
        missionDate: state.missionDate,
      }))
    ),
    ...(local?.completedRecommendationIds ?? []).map((recommendationId) => ({
      recommendationId,
      stateId: null as string | null,
      missionDate: new Date().toISOString().slice(0, 10),
    })),
  ];

  const xpAwarded = await syncCreatorSeasonXpFromCoach({
    userId,
    creatorId,
    missions,
    completedRecommendations,
    coachOnboardingCompleted: coachProfile?.onboardingCompleted ?? false,
  });

  if (xpAwarded > 0) {
    revalidateSeasonPaths();
  }

  return { xpAwarded };
}

export async function recordCoachMissionTaskXpAction(
  taskId: string,
  context: CoachContext,
  options: { stateId?: string | null; mission: DailyMission }
): Promise<{ xpAwarded: number; error?: string }> {
  if (context.scope !== "creator" || !context.scopeId) {
    return { xpAwarded: 0 };
  }

  const userId = await getCurrentUserId();
  if (!userId) return { xpAwarded: 0, error: "Not authenticated." };

  const existingTask = options.mission.tasks.find((task) => task.id === taskId);
  if (existingTask?.completed) {
    return { xpAwarded: 0 };
  }

  const updatedMission = {
    ...options.mission,
    tasks: options.mission.tasks.map((task) =>
      task.id === taskId ? { ...task, completed: true } : task
    ),
  };

  const xpAwarded = await awardMissionTaskSeasonXp({
    userId,
    creatorId: context.scopeId,
    mission: updatedMission,
    taskId,
    stateId: options.stateId,
  });

  if (xpAwarded > 0) {
    revalidateSeasonPaths();
  }

  return { xpAwarded };
}

export async function recordCoachRecommendationXpAction(
  recommendationId: string,
  context: CoachContext,
  options?: { stateId?: string | null; missionDate?: string }
): Promise<{ xpAwarded: number }> {
  if (context.scope !== "creator" || !context.scopeId) {
    return { xpAwarded: 0 };
  }

  const userId = await getCurrentUserId();
  if (!userId) return { xpAwarded: 0 };

  const xpAwarded = await awardRecommendationSeasonXp({
    userId,
    creatorId: context.scopeId,
    recommendationId,
    stateId: options?.stateId,
    missionDate:
      options?.missionDate ?? new Date().toISOString().slice(0, 10),
  });

  if (xpAwarded > 0) {
    revalidateSeasonPaths();
  }

  return { xpAwarded };
}
