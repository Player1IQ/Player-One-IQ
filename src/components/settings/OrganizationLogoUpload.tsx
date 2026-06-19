"use client";

import { useRouter } from "next/navigation";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import {
  removeOrganizationLogo,
  uploadOrganizationLogo,
} from "@/app/settings/actions";
import { getAvatarColor, getAvatarInitials } from "@/lib/creators";

interface OrganizationLogoUploadProps {
  organizationId: string;
  organizationName: string;
  logoUrl?: string | null;
  canEdit: boolean;
}

export function OrganizationLogoUpload({
  organizationId,
  organizationName,
  logoUrl,
  canEdit,
}: OrganizationLogoUploadProps) {
  const router = useRouter();

  async function handleUpload(formData: FormData) {
    const result = await uploadOrganizationLogo(formData);
    if ("error" in result && result.error) {
      return { error: result.error };
    }
    if (!("logoUrl" in result)) {
      return { error: "Upload failed." };
    }
    router.refresh();
    return { url: result.logoUrl };
  }

  async function handleRemove() {
    const result = await removeOrganizationLogo();
    if ("error" in result && result.error) {
      return { error: result.error };
    }
    router.refresh();
    return {};
  }

  return (
    <ImageUploadField
      label="Organization logo"
      description="Shown in the sidebar and across your workspace."
      currentUrl={logoUrl}
      previewInitials={getAvatarInitials(organizationName)}
      previewColor={getAvatarColor(organizationId)}
      previewShape="rounded"
      disabled={!canEdit}
      onUpload={handleUpload}
      onRemove={canEdit ? handleRemove : undefined}
    />
  );
}
