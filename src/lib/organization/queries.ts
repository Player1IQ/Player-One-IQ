import { createClient } from "@/lib/supabase/server";

export interface Organization {
  id: string;
  name: string;
  type: string;
  created_at: string;
}

export async function getOrganizationForUser(): Promise<Organization | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("team_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (membership?.organization_id) {
    const { data: org, error } = await supabase
      .from("organizations")
      .select("id, name, type, created_at")
      .eq("id", membership.organization_id)
      .maybeSingle();

    if (!error && org) return org;
  }

  const { data: ownedOrg } = await supabase
    .from("organizations")
    .select("id, name, type, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return ownedOrg ?? null;
}

export async function getOrganizationId(): Promise<string | null> {
  const org = await getOrganizationForUser();
  return org?.id ?? null;
}

export async function getOrganizationMemberCount(): Promise<number> {
  const supabase = await createClient();
  if (!supabase) return 0;

  const organizationId = await getOrganizationId();
  if (!organizationId) return 0;

  const { count } = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "active");

  return count ?? 0;
}
