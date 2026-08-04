import { isMissionComplete } from "@/lib/creator-coach/missions";
import type { DailyMission } from "@/lib/creator-coach/types";
import { awardCreatorSeasonXp } from "./service";
import type { SeasonXpEventType } from "./types";

function taskSourceKey(
  stateId: string | null | undefined,
  missionId: string,
  taskId: string
): string {
  return stateId
    ? `task:${stateId}:${taskId}`
    : `task:mission:${missionId}:${taskId}`;
}

export function recommendationSourceKey(
  recommendationId: string,
  stateId?: string | null,
  missionDate?: string
): string {
  if (stateId) return `recommendation:${recommendationId}:${stateId}`;
  if (missionDate) return `recommendation:${recommendationId}:${missionDate}`;
  return `recommendation:${recommendationId}`;
}

export async function awardMissionTaskSeasonXp(input: {
  userId: string;
  creatorId: string;
  mission: DailyMission;
  taskId: string;
  stateId?: string | null;
}): Promise<number> {
  const task = input.mission.tasks.find((entry) => entry.id === input.taskId);
  if (!task?.completed) return 0;

  let xpAwarded = 0;

  const taskResult = await awardCreatorSeasonXp({
    userId: input.userId,
    creatorId: input.creatorId,
    eventType: "mission_task",
    sourceKey: taskSourceKey(input.stateId, input.mission.id, input.taskId),
  });
  if (taskResult.awarded && taskResult.xp) {
    xpAwarded += taskResult.xp;
  }

  if (isMissionComplete(input.mission)) {
    const missionResult = await awardCreatorSeasonXp({
      userId: input.userId,
      creatorId: input.creatorId,
      eventType: "mission_complete",
      sourceKey: `mission:${input.mission.id}`,
    });
    if (missionResult.awarded && missionResult.xp) {
      xpAwarded += missionResult.xp;
    }
  }

  return xpAwarded;
}

export async function awardRecommendationSeasonXp(input: {
  userId: string;
  creatorId: string;
  recommendationId: string;
  stateId?: string | null;
  missionDate?: string;
}): Promise<number> {
  const result = await awardCreatorSeasonXp({
    userId: input.userId,
    creatorId: input.creatorId,
    eventType: "recommendation_complete",
    sourceKey: recommendationSourceKey(
      input.recommendationId,
      input.stateId,
      input.missionDate
    ),
  });
  return result.awarded && result.xp ? result.xp : 0;
}

export async function awardCoachOnboardingSeasonXp(input: {
  userId: string;
  creatorId: string;
}): Promise<number> {
  const result = await awardCreatorSeasonXp({
    userId: input.userId,
    creatorId: input.creatorId,
    eventType: "coach_onboarding",
    sourceKey: `coach-onboarding:${input.creatorId}`,
  });
  return result.awarded && result.xp ? result.xp : 0;
}

export async function syncCreatorSeasonXpFromCoach(input: {
  userId: string;
  creatorId: string;
  missions: Array<{ mission: DailyMission; stateId?: string | null }>;
  completedRecommendations?: Array<{
    recommendationId: string;
    stateId?: string | null;
    missionDate?: string;
  }>;
  coachOnboardingCompleted?: boolean;
}): Promise<number> {
  let totalAwarded = 0;

  for (const entry of input.missions) {
    for (const task of entry.mission.tasks) {
      if (!task.completed) continue;
      totalAwarded += await awardMissionTaskSeasonXp({
        userId: input.userId,
        creatorId: input.creatorId,
        mission: entry.mission,
        taskId: task.id,
        stateId: entry.stateId,
      });
    }
  }

  for (const completion of input.completedRecommendations ?? []) {
    totalAwarded += await awardRecommendationSeasonXp({
      userId: input.userId,
      creatorId: input.creatorId,
      recommendationId: completion.recommendationId,
      stateId: completion.stateId,
      missionDate: completion.missionDate,
    });
  }

  if (input.coachOnboardingCompleted) {
    totalAwarded += await awardCoachOnboardingSeasonXp({
      userId: input.userId,
      creatorId: input.creatorId,
    });
  }

  return totalAwarded;
}

export type { SeasonXpEventType };
