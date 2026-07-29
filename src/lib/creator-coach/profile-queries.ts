import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import type { CoachProfile } from "./profile-types";

interface CoachProfileRow {
  id: string;
  activated_at: string | null;
  primary_goal: CoachProfile["primaryGoal"];
  content_focus: string[] | null;
  target_posting_days: string[] | null;
  monetization_interests: string[] | null;
  biggest_challenge: string | null;
  onboarding_completed_at: string | null;
}

function mapProfileRow(row: CoachProfileRow): CoachProfile {
  return {
    id: row.id,
    activated: Boolean(row.activated_at),
    onboardingCompleted: Boolean(row.onboarding_completed_at),
    primaryGoal: row.primary_goal,
    contentFocus: row.content_focus ?? [],
    targetPostingDays: row.target_posting_days ?? [],
    monetizationInterests: row.monetization_interests ?? [],
    biggestChallenge: row.biggest_challenge,
  };
}

export async function getCoachProfile(
  userId: string,
  creatorId: string | null
): Promise<CoachProfile | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const organizationId = await getOrganizationId();
  if (!organizationId) return null;

  let query = supabase
    .from("creator_coach_profiles")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .limit(1);

  query = creatorId
    ? query.eq("creator_id", creatorId)
    : query.is("creator_id", null);

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;

  return mapProfileRow(data as CoachProfileRow);
}
