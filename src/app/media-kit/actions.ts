"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationForUser } from "@/lib/organization/queries";
import {
  canAccessCreator,
  getCurrentUserMembership,
  getCurrentUserRole,
} from "@/lib/permissions";
import { hasFullAccess, isCreatorPortalRole } from "@/lib/team";
import { getCreatorById } from "@/lib/creators/queries";
import { getContracts } from "@/lib/contracts/queries";
import { getCreatorAudienceAnalytics } from "@/lib/platform-oauth/creator-analytics";
import { fetchCreatorContentSnapshots } from "@/lib/platform-oauth/content-aggregate";
import {
  buildMediaKitSnapshot,
  overlayMediaKitIdentity,
} from "@/lib/media-kit/snapshot";
import { createMediaKitToken } from "@/lib/media-kit/token";
import {
  loadMediaKitForCreator,
  mapMediaKitRow,
  type MediaKitRow,
} from "@/lib/media-kit/store";
import {
  MEDIA_KIT_BIO_MAX_LENGTH,
  type MediaKitRecord,
  type MediaKitSectionFlags,
  type MediaKitSnapshot,
} from "@/lib/media-kit/types";

async function requireMediaKitAccess(creatorId: string): Promise<
  | { error: string }
  | { organizationId: string; organizationName: string }
> {
  const membership = await getCurrentUserMembership();
  const role = await getCurrentUserRole();
  if (!membership) return { error: "Not authenticated." };

  if (!(await canAccessCreator(creatorId))) {
    return { error: "Creator not found." };
  }

  const canManage =
    hasFullAccess(role, "creators") ||
    (isCreatorPortalRole(role) && membership.linkedCreatorId === creatorId);

  if (!canManage) return { error: "You cannot manage this media kit." };

  const organization = await getOrganizationForUser();
  if (!organization) return { error: "Organization not found." };

  return {
    organizationId: organization.id,
    organizationName: organization.name,
  };
}

async function rebuildSnapshot(
  creatorId: string,
  kitBio: string,
  organizationName: string
): Promise<MediaKitSnapshot | null> {
  const [creator, analytics, contentSnapshots, contracts] = await Promise.all([
    getCreatorById(creatorId),
    getCreatorAudienceAnalytics(creatorId).catch(() => null),
    fetchCreatorContentSnapshots(creatorId).catch(() => []),
    getContracts(),
  ]);

  if (!creator) return null;

  return buildMediaKitSnapshot({
    creator,
    kitBio,
    organizationName,
    analytics,
    contentSnapshots,
    contracts,
  });
}

async function refreshIdentity(
  creatorId: string,
  kitBio: string,
  organizationName: string,
  existing: MediaKitSnapshot | null,
  forceRebuild: boolean
): Promise<MediaKitSnapshot | null> {
  if (forceRebuild || !existing) {
    return rebuildSnapshot(creatorId, kitBio, organizationName);
  }

  const [creator, contracts] = await Promise.all([
    getCreatorById(creatorId),
    getContracts(),
  ]);
  if (!creator) return null;

  return overlayMediaKitIdentity(existing, {
    creator,
    kitBio,
    organizationName,
    contracts,
  });
}

function revalidateKitPaths(creatorId: string, ...tokens: Array<string | undefined>) {
  revalidatePath(`/creators/${creatorId}`);
  for (const token of tokens) {
    if (token) revalidatePath(`/kit/${token}`);
  }
}

export async function saveCreatorMediaKit(
  creatorId: string,
  input: MediaKitSectionFlags & { kitBio: string; enabled: boolean }
): Promise<{ success: true; kit: MediaKitRecord } | { error: string }> {
  const access = await requireMediaKitAccess(creatorId);
  if ("error" in access) return access;

  const kitBio = input.kitBio.trim().slice(0, MEDIA_KIT_BIO_MAX_LENGTH);
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const existing = await loadMediaKitForCreator(
    supabase,
    creatorId,
    access.organizationId
  );
  const snapshot = await refreshIdentity(
    creatorId,
    kitBio,
    access.organizationName,
    existing?.snapshot ?? null,
    Boolean(input.enabled && !existing?.snapshot)
  );
  if (!snapshot) return { error: "Creator not found." };

  const token = existing?.token ?? createMediaKitToken();
  const now = new Date().toISOString();

  const payload = {
    organization_id: access.organizationId,
    creator_id: creatorId,
    token,
    enabled: input.enabled,
    kit_bio: kitBio,
    show_audience: input.showAudience,
    show_handles: input.showHandles,
    show_highlights: input.showHighlights,
    show_past_partners: input.showPastPartners,
    show_contact_email: input.showContactEmail,
    snapshot,
    snapshot_updated_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("creator_media_kits")
    .upsert(payload, { onConflict: "creator_id" })
    .select("*")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to save media kit." };
  }

  revalidateKitPaths(creatorId, token);
  return { success: true, kit: mapMediaKitRow(data as MediaKitRow) };
}

export async function refreshCreatorMediaKitSnapshot(
  creatorId: string
): Promise<{ success: true; kit: MediaKitRecord } | { error: string }> {
  const access = await requireMediaKitAccess(creatorId);
  if ("error" in access) return access;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const existing = await loadMediaKitForCreator(
    supabase,
    creatorId,
    access.organizationId
  );
  if (!existing) return { error: "Save the media kit first." };

  const snapshot = await rebuildSnapshot(
    creatorId,
    existing.kitBio,
    access.organizationName
  );
  if (!snapshot) return { error: "Creator not found." };

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("creator_media_kits")
    .update({
      snapshot,
      snapshot_updated_at: now,
      updated_at: now,
    })
    .eq("id", existing.id)
    .eq("organization_id", access.organizationId)
    .select("*")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to refresh media kit stats." };
  }

  revalidateKitPaths(creatorId, existing.token);
  return { success: true, kit: mapMediaKitRow(data as MediaKitRow) };
}

export async function rotateCreatorMediaKitToken(
  creatorId: string
): Promise<{ success: true; token: string } | { error: string }> {
  const access = await requireMediaKitAccess(creatorId);
  if ("error" in access) return access;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const existing = await loadMediaKitForCreator(
    supabase,
    creatorId,
    access.organizationId
  );
  if (!existing) return { error: "Save the media kit first." };

  const token = createMediaKitToken();
  const { error } = await supabase
    .from("creator_media_kits")
    .update({ token, updated_at: new Date().toISOString() })
    .eq("id", existing.id)
    .eq("organization_id", access.organizationId);

  if (error) return { error: error.message };

  revalidateKitPaths(creatorId, existing.token, token);
  return { success: true, token };
}
