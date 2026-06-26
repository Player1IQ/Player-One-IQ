import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import { getCurrentUserMembership } from "@/lib/permissions";
import { mapCreatorRow, type Creator, type CreatorRow } from "./types";
import { isPortalRole } from "@/lib/team";

export async function getCreators(): Promise<Creator[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const membership = await getCurrentUserMembership();
  if (membership && isPortalRole(membership.role)) {
    if (!membership.linkedCreatorId) return [];
    const creator = await getCreatorById(membership.linkedCreatorId);
    return creator ? [creator] : [];
  }

  const { data, error } = await supabase
    .from("creators")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as CreatorRow[]).map(mapCreatorRow);
}

export async function getCreatorById(id: string): Promise<Creator | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const organizationId = await getOrganizationId();
  if (!organizationId) return null;

  const membership = await getCurrentUserMembership();
  if (
    membership &&
    isPortalRole(membership.role) &&
    membership.linkedCreatorId &&
    membership.linkedCreatorId !== id
  ) {
    return null;
  }

  const { data, error } = await supabase
    .from("creators")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) return null;
  return mapCreatorRow(data as CreatorRow);
}
