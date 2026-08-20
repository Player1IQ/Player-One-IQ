"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActionErrors } from "@/lib/i18n/action-errors";
import {
  USER_AVATARS_BUCKET,
  buildUserAvatarPath,
  getExtensionFromMime,
  removeStorageObject,
  storagePathFromPublicUrl,
  uploadImageToStorage,
} from "@/lib/storage/images";

export async function getMyAvatarUrl(): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("user_profiles")
    .select("avatar_url")
    .eq("user_id", user.id)
    .maybeSingle();

  return data?.avatar_url ?? null;
}

export async function uploadMyAvatar(formData: FormData) {
  const te = await getActionErrors();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: te("chooseImage") };
  }

  const supabase = await createClient();
  if (!supabase) return { error: te("supabaseNotConfigured") };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: te("mustBeSignedIn") };

  const extension = getExtensionFromMime(file.type);
  if (!extension) return { error: te("unsupportedImageType") };

  const { data: existing } = await supabase
    .from("user_profiles")
    .select("avatar_url")
    .eq("user_id", user.id)
    .maybeSingle();

  const path = buildUserAvatarPath(user.id, extension);
  const uploadResult = await uploadImageToStorage(
    supabase,
    USER_AVATARS_BUCKET,
    path,
    file
  );

  if ("error" in uploadResult) return { error: uploadResult.error };

  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: user.id,
      avatar_url: uploadResult.publicUrl,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) return { error: error.message };

  const previousPath = storagePathFromPublicUrl(
    USER_AVATARS_BUCKET,
    existing?.avatar_url
  );
  if (previousPath && previousPath !== path) {
    await removeStorageObject(supabase, USER_AVATARS_BUCKET, previousPath);
  }

  revalidatePath("/settings");
  revalidatePath("/portal/account");
  revalidatePath("/account");
  revalidatePath("/");
  return { success: true, avatarUrl: uploadResult.publicUrl };
}

export async function removeMyAvatar() {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: existing } = await supabase
    .from("user_profiles")
    .select("avatar_url")
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: user.id,
      avatar_url: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) return { error: error.message };

  const previousPath = storagePathFromPublicUrl(
    USER_AVATARS_BUCKET,
    existing?.avatar_url
  );
  await removeStorageObject(supabase, USER_AVATARS_BUCKET, previousPath);

  revalidatePath("/settings");
  revalidatePath("/portal/account");
  revalidatePath("/account");
  revalidatePath("/");
  return { success: true };
}
