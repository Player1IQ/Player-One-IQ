"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import { organizationTypes } from "@/lib/organization";
import { requireSettingsManageAccess } from "@/lib/permissions";
import {
  ORG_ASSETS_BUCKET,
  buildOrgLogoPath,
  getExtensionFromMime,
  removeStorageObject,
  storagePathFromPublicUrl,
  uploadImageToStorage,
} from "@/lib/storage/images";

export interface OrganizationSettingsInput {
  name: string;
  type: string;
}

export async function uploadOrganizationLogo(formData: FormData) {
  const permError = await requireSettingsManageAccess();
  if (permError) return permError;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose an image to upload." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const extension = getExtensionFromMime(file.type);
  if (!extension) return { error: "Unsupported image type." };

  const { data: existingOrg } = await supabase
    .from("organizations")
    .select("logo_url")
    .eq("id", organizationId)
    .maybeSingle();

  const path = buildOrgLogoPath(organizationId, extension);
  const uploadResult = await uploadImageToStorage(
    supabase,
    ORG_ASSETS_BUCKET,
    path,
    file
  );

  if ("error" in uploadResult) return { error: uploadResult.error };

  const { error } = await supabase
    .from("organizations")
    .update({ logo_url: uploadResult.publicUrl })
    .eq("id", organizationId);

  if (error) return { error: error.message };

  const previousPath = storagePathFromPublicUrl(
    ORG_ASSETS_BUCKET,
    existingOrg?.logo_url
  );
  if (previousPath && previousPath !== path) {
    await removeStorageObject(supabase, ORG_ASSETS_BUCKET, previousPath);
  }

  revalidatePath("/settings");
  revalidatePath("/");
  return { success: true, logoUrl: uploadResult.publicUrl };
}

export async function removeOrganizationLogo() {
  const permError = await requireSettingsManageAccess();
  if (permError) return permError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { data: existingOrg } = await supabase
    .from("organizations")
    .select("logo_url")
    .eq("id", organizationId)
    .maybeSingle();

  const { error } = await supabase
    .from("organizations")
    .update({ logo_url: null })
    .eq("id", organizationId);

  if (error) return { error: error.message };

  const previousPath = storagePathFromPublicUrl(
    ORG_ASSETS_BUCKET,
    existingOrg?.logo_url
  );
  await removeStorageObject(supabase, ORG_ASSETS_BUCKET, previousPath);

  revalidatePath("/settings");
  revalidatePath("/");
  return { success: true };
}

export async function updateOrganizationSettings(input: OrganizationSettingsInput) {
  const permError = await requireSettingsManageAccess();
  if (permError) return permError;

  const name = input.name.trim();
  if (!name) return { error: "Organization name is required." };

  if (!organizationTypes.includes(input.type as (typeof organizationTypes)[number])) {
    return { error: "Invalid organization type." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { error } = await supabase
    .from("organizations")
    .update({ name, type: input.type })
    .eq("id", organizationId);

  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.auth.updateUser({
      data: { organization_name: name, organization_type: input.type },
    });
  }

  revalidatePath("/settings");
  revalidatePath("/");
  return { success: true };
}
