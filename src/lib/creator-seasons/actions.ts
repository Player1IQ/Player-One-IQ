"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/creator-coach/service";
import { getCurrentUserMembership } from "@/lib/permissions";
import { isCreatorPortalRole } from "@/lib/team";
import { optInToActiveSeason } from "./service";
import { syncCreatorSeasonFromCoachAction } from "./season-coach-actions";

export async function joinCreatorSeasonAction(
  creatorId: string
): Promise<{ success: true } | { error: string }> {
  const userId = await getCurrentUserId();
  if (!userId) return { error: "Not authenticated." };

  const membership = await getCurrentUserMembership();
  if (!membership || !isCreatorPortalRole(membership.role)) {
    return { error: "Seasons are only available in the creator portal." };
  }

  if (membership.linkedCreatorId !== creatorId) {
    return { error: "You can only join a season for your linked creator." };
  }

  const result = await optInToActiveSeason(userId, creatorId);
  if ("error" in result) return result;

  await syncCreatorSeasonFromCoachAction(creatorId);

  revalidatePath("/portal");
  revalidatePath("/portal/seasons");
  return { success: true };
}
