"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import { awardCreatorSeasonXp } from "@/lib/creator-seasons/service";
import type { CoachProfileInput } from "./profile-types";

export async function saveCoachProfileAction(
  creatorId: string | null,
  input: CoachProfileInput
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Coach profile is not configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const now = new Date().toISOString();
  const payload = {
    organization_id: organizationId,
    user_id: user.id,
    creator_id: creatorId,
    activated_at: now,
    primary_goal: input.primaryGoal,
    content_focus: input.contentFocus,
    target_posting_days: input.targetPostingDays,
    monetization_interests: input.monetizationInterests,
    biggest_challenge: input.biggestChallenge?.trim() || null,
    onboarding_completed_at: now,
    updated_at: now,
  };

  let existingQuery = supabase
    .from("creator_coach_profiles")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id);

  existingQuery = creatorId
    ? existingQuery.eq("creator_id", creatorId)
    : existingQuery.is("creator_id", null);

  const { data: existing, error: lookupError } = await existingQuery.maybeSingle();

  if (lookupError) {
    const missingTable = lookupError.message.includes("creator_coach_profiles");
    return {
      error: missingTable
        ? "Creator Coach is not set up yet. Ask your workspace admin to apply the latest database migration."
        : "Unable to load your Creator Coach preferences.",
    };
  }

  const { error } = existing?.id
    ? await supabase
        .from("creator_coach_profiles")
        .update(payload)
        .eq("id", existing.id)
    : await supabase.from("creator_coach_profiles").insert(payload);

  if (error) {
    if (error.code === "42P01") {
      return {
        error:
          "Creator Coach is not set up yet. Ask your workspace admin to apply the latest database migration.",
      };
    }
    return { error: "Unable to save your Creator Coach preferences." };
  }

  if (creatorId) {
    await awardCreatorSeasonXp({
      userId: user.id,
      creatorId,
      eventType: "coach_onboarding",
      sourceKey: `coach-onboarding:${creatorId}`,
    });
  }

  revalidatePath("/portal");
  revalidatePath("/portal/seasons");
  revalidatePath("/dashboard");
  return { success: true };
}
