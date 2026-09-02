import type { SupabaseClient } from "@supabase/supabase-js";
import type { MediaKitRecord, MediaKitSnapshot } from "./types";

export interface MediaKitRow {
  id: string;
  organization_id: string;
  creator_id: string;
  token: string;
  enabled: boolean;
  kit_bio: string;
  show_audience: boolean;
  show_handles: boolean;
  show_highlights: boolean;
  show_past_partners: boolean;
  show_contact_email: boolean;
  snapshot: MediaKitSnapshot | null;
  snapshot_updated_at: string | null;
}

export function mapMediaKitRow(row: MediaKitRow): MediaKitRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    creatorId: row.creator_id,
    token: row.token,
    enabled: row.enabled,
    kitBio: row.kit_bio ?? "",
    showAudience: row.show_audience,
    showHandles: row.show_handles,
    showHighlights: row.show_highlights,
    showPastPartners: row.show_past_partners,
    showContactEmail: row.show_contact_email,
    snapshot: row.snapshot,
    snapshotUpdatedAt: row.snapshot_updated_at,
  };
}

export async function loadMediaKitForCreator(
  supabase: SupabaseClient,
  creatorId: string,
  organizationId: string
): Promise<MediaKitRecord | null> {
  const { data, error } = await supabase
    .from("creator_media_kits")
    .select("*")
    .eq("creator_id", creatorId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) return null;
  return mapMediaKitRow(data as MediaKitRow);
}

export async function loadEnabledMediaKitByToken(
  supabase: SupabaseClient,
  token: string
): Promise<MediaKitRecord | null> {
  const { data, error } = await supabase
    .from("creator_media_kits")
    .select("*")
    .eq("token", token)
    .eq("enabled", true)
    .maybeSingle();

  if (error || !data) return null;
  return mapMediaKitRow(data as MediaKitRow);
}
