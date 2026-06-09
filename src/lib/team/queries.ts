import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import {
  mapInvitationRow,
  mapTeamMemberRow,
  type TeamInvitationRow,
  type TeamMember,
  type TeamMemberRow,
} from "@/lib/team";

export async function getTeamMembers(): Promise<TeamMember[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const [{ data: members, error: membersError }, { data: invitations, error: invitesError }] =
    await Promise.all([
      supabase
        .from("team_members")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: true }),
      supabase
        .from("team_invitations")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
    ]);

  if (membersError) return [];

  const memberList = (members as TeamMemberRow[] | null)?.map(mapTeamMemberRow) ?? [];
  const inviteList =
  !invitesError && invitations
    ? (invitations as TeamInvitationRow[]).map(mapInvitationRow)
    : [];

  return [...memberList, ...inviteList];
}

export async function getTeamMemberById(id: string): Promise<TeamMember | null> {
  const members = await getTeamMembers();
  return members.find((m) => m.id === id) ?? null;
}

export async function getInvitationByToken(
  token: string
): Promise<{
  id: string;
  email: string;
  role: string;
  organizationName: string;
  status: string;
  expiresAt: string;
} | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("team_invitations")
    .select(
      "id, email, role, status, expires_at, organizations ( name )"
    )
    .eq("token", token)
    .maybeSingle();

  if (error || !data) return null;

  const org = Array.isArray(data.organizations)
    ? data.organizations[0]
    : data.organizations;

  return {
    id: data.id,
    email: data.email,
    role: data.role,
    organizationName: (org as { name: string } | null)?.name ?? "Organization",
    status: data.status,
    expiresAt: data.expires_at,
  };
}

export async function getPendingInvitationForUser(): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const { data } = await supabase
    .from("team_invitations")
    .select("token")
    .eq("status", "pending")
    .ilike("email", user.email)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.token ?? null;
}
