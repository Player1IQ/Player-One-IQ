"use server";

import { revalidatePath } from "next/cache";
import {
  buildCreatorCoachSnapshot,
  getCurrentUserId,
  runRecommendationEngine,
} from "./service";
import {
  completeMissionTask,
  generateDailyMission,
  isMissionComplete,
  nextMissionSequence,
} from "./missions";
import {
  getLatestCoachStateForToday,
  insertNewMissionState,
  updateCreatorCoachMission,
} from "./queries";
import {
  awardMissionTaskSeasonXp,
  awardRecommendationSeasonXp,
} from "@/lib/creator-seasons/sync-coach-xp";
import type { CoachContext, CreatorCoachSnapshot } from "./types";

async function requireUserId(): Promise<string | null> {
  return getCurrentUserId();
}

export async function completeCoachMissionTaskAction(
  stateId: string,
  taskId: string,
  context: CoachContext,
  revalidatePaths: string[] = ["/portal", "/dashboard"]
): Promise<{ snapshot?: CreatorCoachSnapshot; error?: string }> {
  const userId = await requireUserId();
  if (!userId) return { error: "Not authenticated." };

  const creatorId = context.scope === "creator" ? context.scopeId : null;
  const persisted = await getLatestCoachStateForToday(userId, creatorId);
  if (!persisted || persisted.id !== stateId) {
    return { error: "Mission state not found." };
  }

  const existingTask = persisted.mission.tasks.find((task) => task.id === taskId);
  if (!existingTask) {
    return { error: "Task not found." };
  }
  if (existingTask.completed) {
    return { snapshot: await buildCreatorCoachSnapshot({ userId, creatorCoachContext: context }) };
  }

  const updatedMission = completeMissionTask(persisted.mission, taskId);
  const dismissedIds = persisted.dismissedRecommendationIds;
  const completedIds = persisted.completedRecommendationIds;
  const missionWasComplete = isMissionComplete(updatedMission);

  if (context.scope === "creator" && context.scopeId) {
    await awardMissionTaskSeasonXp({
      userId,
      creatorId: context.scopeId,
      mission: updatedMission,
      taskId,
      stateId,
    });
  }

  if (missionWasComplete) {
    const recommendations = runRecommendationEngine(context, {
      dismissedIds,
      completedIds,
    });
    const newMission = generateDailyMission(context, recommendations, {
      sequence: nextMissionSequence(updatedMission),
    });
    await insertNewMissionState({
      userId,
      creatorId,
      mission: newMission,
      dismissedRecommendationIds: dismissedIds,
      completedRecommendationIds: completedIds,
      missionSequence: nextMissionSequence(updatedMission),
    });
  } else {
    await updateCreatorCoachMission(stateId, updatedMission);
  }

  for (const path of revalidatePaths) {
    revalidatePath(path);
  }
  revalidatePath("/portal/seasons");

  const snapshot = await buildCreatorCoachSnapshot({
    userId,
    creatorCoachContext: context,
  });
  return { snapshot };
}

export async function dismissCoachRecommendationAction(
  stateId: string,
  recommendationId: string,
  context: CoachContext,
  revalidatePaths: string[] = ["/portal", "/dashboard"]
): Promise<{ snapshot?: CreatorCoachSnapshot; error?: string }> {
  const userId = await requireUserId();
  if (!userId) return { error: "Not authenticated." };

  const creatorId = context.scope === "creator" ? context.scopeId : null;
  const persisted = await getLatestCoachStateForToday(userId, creatorId);
  if (!persisted) return { error: "Coach state not found." };

  const dismissedIds = Array.from(
    new Set([...persisted.dismissedRecommendationIds, recommendationId])
  );

  await updateCreatorCoachMission(persisted.id, persisted.mission, {
    dismissedRecommendationIds: dismissedIds,
  });

  for (const path of revalidatePaths) {
    revalidatePath(path);
  }

  const snapshot = await buildCreatorCoachSnapshot({
    userId,
    creatorCoachContext: context,
  });
  return { snapshot };
}

export async function completeCoachRecommendationAction(
  stateId: string,
  recommendationId: string,
  context: CoachContext,
  revalidatePaths: string[] = ["/portal", "/dashboard"]
): Promise<{ snapshot?: CreatorCoachSnapshot; error?: string }> {
  const userId = await requireUserId();
  if (!userId) return { error: "Not authenticated." };

  const creatorId = context.scope === "creator" ? context.scopeId : null;
  const persisted = await getLatestCoachStateForToday(userId, creatorId);
  if (!persisted) return { error: "Coach state not found." };

  if (persisted.completedRecommendationIds.includes(recommendationId)) {
    return {
      snapshot: await buildCreatorCoachSnapshot({
        userId,
        creatorCoachContext: context,
      }),
    };
  }

  const completedIds = Array.from(
    new Set([...persisted.completedRecommendationIds, recommendationId])
  );

  await updateCreatorCoachMission(persisted.id, persisted.mission, {
    completedRecommendationIds: completedIds,
  });

  if (context.scope === "creator" && context.scopeId) {
    await awardRecommendationSeasonXp({
      userId,
      creatorId: context.scopeId,
      recommendationId,
    });
  }

  for (const path of revalidatePaths) {
    revalidatePath(path);
  }
  revalidatePath("/portal/seasons");

  const snapshot = await buildCreatorCoachSnapshot({
    userId,
    creatorCoachContext: context,
  });
  return { snapshot };
}
