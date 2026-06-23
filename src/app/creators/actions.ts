"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import {
  requireFeatureAccess,
  requireUsageWithinLimit,
  requireResourceWriteAccess,
} from "@/lib/permissions";
import {
  type CreatorInput,
  platforms,
  creatorStatuses,
} from "@/lib/creators";
import { presenceStatuses } from "@/lib/presence/types";
import {
  CREATOR_AVATARS_BUCKET,
  buildCreatorAvatarPath,
  getExtensionFromMime,
  removeStorageObject,
  storagePathFromPublicUrl,
  uploadImageToStorage,
} from "@/lib/storage/images";

function validateInput(input: CreatorInput) {
  if (!input.name.trim()) {
    return "Creator name is required.";
  }
  if (!platforms.includes(input.primaryPlatform)) {
    return "Invalid primary platform.";
  }
  if (!creatorStatuses.includes(input.status)) {
    return "Invalid status.";
  }
  if (!presenceStatuses.includes(input.availabilityStatus)) {
    return "Invalid availability status.";
  }
  return null;
}

export async function createCreator(input: CreatorInput) {
  const permError = await requireResourceWriteAccess("creators");
  if (permError) return permError;

  const error = validateInput(input);
  if (error) return { error };

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const featureError = await requireFeatureAccess(
    "creator_profiles",
    "Creator profiles"
  );
  if (featureError) return featureError;

  const { count: creatorCount } = await supabase
    .from("creators")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  const limitError = await requireUsageWithinLimit(
    "creators",
    creatorCount ?? 0,
    "creator profiles"
  );
  if (limitError) return limitError;

  const { data, error: insertError } = await supabase
    .from("creators")
    .insert({
      organization_id: organizationId,
      name: input.name.trim(),
      email: input.email.trim() || null,
      primary_platform: input.primaryPlatform,
      social_handles: input.socialHandles.filter((h) => h.handle.trim()),
      status: input.status,
      availability_status: input.availabilityStatus,
      notes: input.notes.trim() || null,
    })
    .select("id")
    .single();

  if (insertError) return { error: insertError.message };

  revalidatePath("/creators");
  revalidatePath("/");
  return { id: data.id };
}

export async function updateCreator(id: string, input: CreatorInput) {
  const permError = await requireResourceWriteAccess("creators");
  if (permError) return permError;

  const error = validateInput(input);
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
      social_handles: input.socialHandles.filter((h) => h.handle.trim()),
      status: input.status,
      availability_status: input.availabilityStatus,
      notes: input.notes.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/creators");
  revalidatePath(`/creators/${id}`);
  return { success: true };
}

export async function uploadCreatorAvatar(creatorId: string, formData: FormData) {
  const permError = await requireResourceWriteAccess("creators");
  if (permError) return permError;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose an image to upload." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { data: creator, error: creatorError } = await supabase
    .from("creators")
    .select("id, avatar_url")
    .eq("id", creatorId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (creatorError) return { error: creatorError.message };
  if (!creator) return { error: "Creator not found." };

  const extension = getExtensionFromMime(file.type);
  if (!extension) return { error: "Unsupported image type." };

  const path = buildCreatorAvatarPath(organizationId, creatorId, extension);
  const uploadResult = await uploadImageToStorage(
    supabase,
    CREATOR_AVATARS_BUCKET,
    path,
    file
  );

  if ("error" in uploadResult) return { error: uploadResult.error };

  const { error: updateError } = await supabase
    .from("creators")
    .update({
      avatar_url: uploadResult.publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", creatorId)
    .eq("organization_id", organizationId);

  if (updateError) return { error: updateError.message };

  const previousPath = storagePathFromPublicUrl(
    CREATOR_AVATARS_BUCKET,
    creator.avatar_url
  );
  if (previousPath && previousPath !== path) {
    await removeStorageObject(supabase, CREATOR_AVATARS_BUCKET, previousPath);
  }

  revalidatePath("/creators");
  revalidatePath(`/creators/${creatorId}`);
  revalidatePath("/");
  return { success: true, avatarUrl: uploadResult.publicUrl };
}

export async function removeCreatorAvatar(creatorId: string) {
  const permError = await requireResourceWriteAccess("creators");
  if (permError) return permError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { data: creator, error: creatorError } = await supabase
    .from("creators")
    .select("avatar_url")
    .eq("id", creatorId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (creatorError) return { error: creatorError.message };
  if (!creator) return { error: "Creator not found." };

  const { error: updateError } = await supabase
    .from("creators")
    .update({
      avatar_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", creatorId)
    .eq("organization_id", organizationId);

  if (updateError) return { error: updateError.message };

  const previousPath = storagePathFromPublicUrl(
    CREATOR_AVATARS_BUCKET,
    creator.avatar_url
  );
  await removeStorageObject(supabase, CREATOR_AVATARS_BUCKET, previousPath);

  revalidatePath("/creators");
  revalidatePath(`/creators/${creatorId}`);
  revalidatePath("/");
  return { success: true };
}

export async function deleteCreator(id: string) {
  const permError = await requireResourceWriteAccess("creators");
  if (permError) return permError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { data: creator } = await supabase
    .from("creators")
    .select("avatar_url")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  const { error: deleteError } = await supabase
    .from("creators")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (deleteError) return { error: deleteError.message };

  const previousPath = storagePathFromPublicUrl(
    CREATOR_AVATARS_BUCKET,
    creator?.avatar_url
  );
  await removeStorageObject(supabase, CREATOR_AVATARS_BUCKET, previousPath);

  revalidatePath("/creators");
  revalidatePath("/");
  return { success: true };
}
