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

  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, type, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function getOrganizationId(): Promise<string | null> {
  const org = await getOrganizationForUser();
  return org?.id ?? null;
}
