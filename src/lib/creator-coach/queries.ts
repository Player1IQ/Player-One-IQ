import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import type {
  CreatorCoachPersistedState,
  CreatorCoachStateRow,
  DailyMission,
} from "./types";

function mapStateRow(row: CreatorCoachStateRow): CreatorCoachPersistedState {
  return {
    id: row.id,
    missionDate: row.mission_date,
    mission: row.mission_json,
    dismissedRecommendationIds: row.dismissed_recommendation_ids ?? [],
    completedRecommendationIds: row.completed_recommendation_ids ?? [],
  };
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getCreatorCoachState(
  userId: string,
  creatorId: string | null
): Promise<CreatorCoachPersistedState | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const organizationId = await getOrganizationId();
  if (!organizationId) return null;

  let query = supabase
    .from("creator_coach_state")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("mission_date", todayKey())
    .order("updated_at", { ascending: false })
    .limit(1);

  query = creatorId
    ? query.eq("creator_id", creatorId)
    : query.is("creator_id", null);

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;

  return mapStateRow(data as CreatorCoachStateRow);
}

export async function updateCreatorCoachMission(
  stateId: string,
  mission: DailyMission,
  updates?: {
    dismissedRecommendationIds?: string[];
    completedRecommendationIds?: string[];
  }
): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) return false;

  const payload: Record<string, unknown> = {
    mission_json: mission,
    updated_at: new Date().toISOString(),
  };

  if (updates?.dismissedRecommendationIds) {
    payload.dismissed_recommendation_ids = updates.dismissedRecommendationIds;
  }
  if (updates?.completedRecommendationIds) {
    payload.completed_recommendation_ids = updates.completedRecommendationIds;
  }

  const { error } = await supabase
    .from("creator_coach_state")
    .update(payload)
    .eq("id", stateId);

  return !error;
}

export async function insertNewMissionState(input: {
  userId: string;
  creatorId: string | null;
  mission: DailyMission;
  dismissedRecommendationIds: string[];
  completedRecommendationIds: string[];
  missionSequence: number;
}): Promise<CreatorCoachPersistedState | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const organizationId = await getOrganizationId();
  if (!organizationId) return null;

  const { data, error } = await supabase
    .from("creator_coach_state")
    .insert({
      organization_id: organizationId,
      user_id: input.userId,
      creator_id: input.creatorId,
      mission_date: input.mission.missionDate,
      mission_sequence: input.missionSequence,
      mission_json: input.mission,
      dismissed_recommendation_ids: input.dismissedRecommendationIds,
      completed_recommendation_ids: input.completedRecommendationIds,
    })
    .select("*")
    .single();

  if (error || !data) return null;
  return mapStateRow(data as CreatorCoachStateRow);
}

export async function getLatestCoachStateForToday(
  userId: string,
  creatorId: string | null
): Promise<CreatorCoachPersistedState | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const organizationId = await getOrganizationId();
  if (!organizationId) return null;

  let query = supabase
    .from("creator_coach_state")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("mission_date", todayKey())
    .order("mission_sequence", { ascending: false })
    .limit(1);

  query = creatorId
    ? query.eq("creator_id", creatorId)
    : query.is("creator_id", null);

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;

  return mapStateRow(data as CreatorCoachStateRow);
}
