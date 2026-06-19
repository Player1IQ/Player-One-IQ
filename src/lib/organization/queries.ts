import { createClient } from "@/lib/supabase/server";
import { getActiveOrganizationIdCookie } from "./context";

export interface Organization {
  id: string;
  name: string;
  type: string;
  logo_url: string | null;
  created_at: string;
}

export type OrganizationRole =
  | "owner"
  | "admin"
  | "manager"
  | "partnerships"
  | "talent_manager"
  | "member"
  | "viewer"
  | "player"
  | "content_creator";

export interface UserOrganization {
  id: string;
  name: string;
  type: string;
  role: OrganizationRole;
}

function mapMembershipOrg(
  row: {
    organization_id: string;
    role: string;
    organizations:
      | { id: string; name: string; type: string }
      | { id: string; name: string; type: string }[]
      | null;
  }
): UserOrganization | null {
  const org = Array.isArray(row.organizations)
    ? row.organizations[0]
    : row.organizations;

  if (!org) return null;

  return {
    id: org.id,
    name: org.name,
    type: org.type,
    role: row.role as OrganizationRole,
  };
}

export async function getUserOrganizations(): Promise<UserOrganization[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships } = await supabase
    .from("team_members")
    .select("organization_id, role, organizations(id, name, type)")
    .eq("user_id", user.id)
    .eq("status", "active");

  const byId = new Map<string, UserOrganization>();

  for (const row of memberships ?? []) {
    const mapped = mapMembershipOrg(row);
    if (mapped) byId.set(mapped.id, mapped);
  }

  const { data: ownedOrg } = await supabase
    .from("organizations")
    .select("id, name, type")
    .eq("user_id", user.id)
    .maybeSingle();

  if (ownedOrg && !byId.has(ownedOrg.id)) {
    byId.set(ownedOrg.id, {
      id: ownedOrg.id,
      name: ownedOrg.name,
      type: ownedOrg.type,
      role: "owner",
    });
  }

  return Array.from(byId.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export async function getOrganizationForUser(): Promise<Organization | null> {
  const organizations = await getUserOrganizations();
  if (organizations.length === 0) return null;

  const activeId = await getActiveOrganizationIdCookie();
  const selected =
    (activeId ? organizations.find((org) => org.id === activeId) : null) ??
    organizations.find((org) => org.role === "owner") ??
    organizations[0];

  const supabase = await createClient();
  if (!supabase) return null;

  const { data: org, error } = await supabase
    .from("organizations")
    .select("id, name, type, logo_url, created_at")
    .eq("id", selected.id)
    .maybeSingle();

  if (error || !org) return null;
  return org;
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
