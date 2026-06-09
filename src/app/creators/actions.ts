"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import { requireWriteAccess } from "@/lib/permissions";
import {
  type CreatorInput,
  platforms,
  creatorStatuses,
} from "@/lib/creators";

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
  return null;
}

export async function createCreator(input: CreatorInput) {
  const permError = await requireWriteAccess();
  if (permError) return permError;

  const error = validateInput(input);
  if (error) return { error };

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { data, error: insertError } = await supabase
    .from("creators")
    .insert({
      organization_id: organizationId,
      name: input.name.trim(),
      email: input.email.trim() || null,
      primary_platform: input.primaryPlatform,
      social_handles: input.socialHandles.filter((h) => h.handle.trim()),
      status: input.status,
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
  const permError = await requireWriteAccess();
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

export async function deleteCreator(id: string) {
  const permError = await requireWriteAccess();
  if (permError) return permError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { error: deleteError } = await supabase
    .from("creators")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (deleteError) return { error: deleteError.message };

  revalidatePath("/creators");
  revalidatePath("/");
  return { success: true };
}
