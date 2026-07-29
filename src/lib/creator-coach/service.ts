import { createClient } from "@/lib/supabase/server";
import { displayNameFromEmail } from "@/lib/team";
import { buildGreeting } from "./greeting";
import {
  buildCreatorCoachContext,
  buildOrganizationCoachContext,
} from "./context";
import { runRecommendationEngine } from "./engine";
import {
  generateDailyMission,
  getMissionProgress,
  isMissionComplete,
} from "./missions";
import {
  getLatestCoachStateForToday,
  insertNewMissionState,
} from "./queries";
import type { CoachContext, CreatorCoachSnapshot } from "./types";

export interface BuildCreatorCoachSnapshotInput {
  userId: string;
  creatorCoachContext: CoachContext;
}

export async function buildCreatorCoachSnapshot(
  input: BuildCreatorCoachSnapshotInput
): Promise<CreatorCoachSnapshot> {
  const { userId, creatorCoachContext: context } = input;
  const creatorId =
    context.scope === "creator" ? context.scopeId : null;

  let persisted = await getLatestCoachStateForToday(userId, creatorId);
  const dismissedIds = persisted?.dismissedRecommendationIds ?? [];
  const completedIds = persisted?.completedRecommendationIds ?? [];

  const recommendations = runRecommendationEngine(context, {
    dismissedIds,
    completedIds,
  });

  let mission = persisted?.mission;
  if (!mission || isMissionComplete(mission)) {
    const sequence = mission ? 1 : 0;
    mission = generateDailyMission(context, recommendations, {
      sequence,
    });

    if (persisted && isMissionComplete(persisted.mission)) {
      persisted = await insertNewMissionState({
        userId,
        creatorId,
        mission,
        dismissedRecommendationIds: dismissedIds,
        completedRecommendationIds: completedIds,
        missionSequence: sequence,
      });
    } else if (!persisted) {
      persisted = await insertNewMissionState({
        userId,
        creatorId,
        mission,
        dismissedRecommendationIds: dismissedIds,
        completedRecommendationIds: completedIds,
        missionSequence: 0,
      });
    }
  }

  return {
    stateId: persisted?.id ?? null,
    firstName: context.firstName,
    greeting: buildGreeting(context.firstName),
    mission: mission!,
    recommendations,
    progressPercent: getMissionProgress(mission!),
    scope: context.scope,
    scopeId: context.scopeId,
  };
}

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getCurrentUserDisplayName(): Promise<string> {
  const supabase = await createClient();
  if (!supabase) return "there";
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return "there";
  return displayNameFromEmail(user.email);
}

export {
  buildCreatorCoachContext,
  buildOrganizationCoachContext,
  runRecommendationEngine,
  generateDailyMission,
  getMissionProgress,
  isMissionComplete,
};

export type { CoachContext, CreatorCoachSnapshot };
