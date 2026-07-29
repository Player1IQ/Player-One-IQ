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

  const updatedMission = completeMissionTask(persisted.mission, taskId);
  const dismissedIds = persisted.dismissedRecommendationIds;
  const completedIds = persisted.completedRecommendationIds;

  if (isMissionComplete(updatedMission)) {
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

  const completedIds = Array.from(
    new Set([...persisted.completedRecommendationIds, recommendationId])
  );

  await updateCreatorCoachMission(persisted.id, persisted.mission, {
    completedRecommendationIds: completedIds,
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
