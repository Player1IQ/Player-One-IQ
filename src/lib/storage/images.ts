import type { SupabaseClient } from "@supabase/supabase-js";

export const ORG_ASSETS_BUCKET = "org-assets";
export const CREATOR_AVATARS_BUCKET = "creator-avatars";
export const USER_AVATARS_BUCKET = "user-avatars";
export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

const extensionByMime: Record<AllowedImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as AllowedImageType)) {
    return "Image must be JPEG, PNG, WebP, or GIF.";
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Image must be 2 MB or smaller.";
  }
  return null;
}

export function getExtensionFromMime(mime: string): string | null {
  return extensionByMime[mime as AllowedImageType] ?? null;
}

export function buildOrgLogoPath(organizationId: string, extension: string): string {
  return `${organizationId}/logo.${extension}`;
}

export function buildCreatorAvatarPath(
  organizationId: string,
  creatorId: string,
  extension: string
): string {
  return `${organizationId}/${creatorId}.${extension}`;
}

export function buildUserAvatarPath(userId: string, extension: string): string {
  return `${userId}/avatar.${extension}`;
}

export function getPublicStorageUrl(bucket: string, path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return "";
  return `${baseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

export function withCacheBust(url: string): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${Date.now()}`;
}

export function storagePathFromPublicUrl(
  bucket: string,
  publicUrl: string | null | undefined
): string | null {
  if (!publicUrl) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return null;
  const pathWithQuery = publicUrl.slice(index + marker.length);
  return pathWithQuery.split("?")[0] ?? null;
}

export async function uploadImageToStorage(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  file: File
): Promise<{ publicUrl: string } | { error: string }> {
  const validationError = validateImageFile(file);
  if (validationError) return { error: validationError };

  const extension = getExtensionFromMime(file.type);
  if (!extension) return { error: "Unsupported image type." };

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });

  if (error) return { error: error.message };

  return {
    publicUrl: withCacheBust(getPublicStorageUrl(bucket, path)),
  };
}

export async function removeStorageObject(
  supabase: SupabaseClient,
  bucket: string,
  path: string | null
): Promise<void> {
  if (!path) return;
  await supabase.storage.from(bucket).remove([path]);
}
