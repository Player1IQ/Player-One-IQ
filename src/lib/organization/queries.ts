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

  const { data: ownedOrg } = await supabase
    .from("organizations")
    .select("id, name, type, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (ownedOrg) return ownedOrg;

  const { data: membership } = await supabase
    .from("team_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!membership?.organization_id) return null;

  const { data: org, error } = await supabase
    .from("organizations")
    .select("id, name, type, created_at")
    .eq("id", membership.organization_id)
    .maybeSingle();

  if (error || !org) return null;
  return org;
}

export async function getOrganizationId(): Promise<string | null> {
  const org = await getOrganizationForUser();
  return org?.id ?? null;
}
