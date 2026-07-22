"use client";

import { useRouter } from "next/navigation";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { removeMyAvatar, uploadMyAvatar } from "@/app/account/actions";
import { getAvatarColor, getAvatarInitials } from "@/lib/team";

interface ProfilePhotoUploadProps {
  userId: string;
  displayName: string;
  email?: string;
  avatarUrl?: string | null;
}

export function ProfilePhotoUpload({
  userId,
  displayName,
  email,
  avatarUrl,
}: ProfilePhotoUploadProps) {
  const router = useRouter();

  async function handleUpload(formData: FormData) {
    const result = await uploadMyAvatar(formData);
    if ("error" in result && result.error) {
      return { error: result.error };
    }
    if (!("avatarUrl" in result) || !result.avatarUrl) {
      return { error: "Upload failed." };
    }
    router.refresh();
    return { url: result.avatarUrl };
  }

  async function handleRemove() {
    const result = await removeMyAvatar();
    if ("error" in result && result.error) {
      return { error: result.error };
    }
    router.refresh();
    return {};
  }

  return (
    <ImageUploadField
      label="Profile photo"
      description="Shown in the sidebar and on your team profile."
      currentUrl={avatarUrl}
      previewInitials={getAvatarInitials(displayName, email ?? displayName)}
      previewColor={getAvatarColor(userId)}
      previewShape="circle"
      onUpload={handleUpload}
      onRemove={handleRemove}
    />
  );
}
