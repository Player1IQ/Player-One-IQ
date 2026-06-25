"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import { getCurrentUserMembership } from "@/lib/permissions";
import type { CreatorPortalProfileInput } from "@/lib/creators/portal-profile";
import { platforms } from "@/lib/creators";
import { isCreatorPortalRole } from "@/lib/team";

export type { CreatorPortalProfileInput } from "@/lib/creators/portal-profile";

function validatePortalProfile(input: CreatorPortalProfileInput): string | null {
  if (!input.name.trim()) return "Name is required.";
  if (!platforms.includes(input.primaryPlatform)) return "Invalid platform.";
  return null;
}

async function requireOwnCreatorProfile(creatorId: string) {
  const membership = await getCurrentUserMembership();
  if (
    !membership ||
    !isCreatorPortalRole(membership.role) ||
    membership.linkedCreatorId !== creatorId
  ) {
    return { error: "You can only update your own profile." as const };
  }
  return { membership };
}

export async function updateCreatorPortalProfile(
  creatorId: string,
  input: CreatorPortalProfileInput
) {
  const access = await requireOwnCreatorProfile(creatorId);
  if ("error" in access) return access;

  const error = validatePortalProfile(input);
  if (error) return { error };

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { error: updateError } = await supabase
    .from("creators")
    .update({
      name: input.name.trim(),
      email: input.email.trim() || null,
      primary_platform: input.primaryPlatform,
      social_handles: input.socialHandles.filter((handle) => handle.handle.trim()),
      updated_at: new Date().toISOString(),
    })
    .eq("id", creatorId)
    .eq("organization_id", organizationId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/portal");
  revalidatePath(`/creators/${creatorId}`);
  return { success: true as const };
}

export async function uploadCreatorPortalAvatar(
  creatorId: string,
  formData: FormData
) {
  const access = await requireOwnCreatorProfile(creatorId);
  if ("error" in access) return access;

  const { uploadCreatorAvatar } = await import("@/app/creators/actions");
  return uploadCreatorAvatar(creatorId, formData);
}
