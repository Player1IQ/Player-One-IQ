import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import { getPresenceForUserIds } from "@/lib/presence/queries";
import {
  mapInvitationRow,
  mapTeamMemberRow,
  type TeamInvitationRow,
  type TeamMember,
  type TeamMemberRow,
} from "@/lib/team";
import type { SupabaseClient } from "@supabase/supabase-js";

async function getAvatarUrlsForUserIds(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  if (userIds.length === 0) return map;

  const { data } = await supabase
    .from("user_profiles")
    .select("user_id, avatar_url")
    .in("user_id", userIds);

  for (const row of data ?? []) {
    map.set(row.user_id, row.avatar_url ?? null);
  }

  return map;
}

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

  const memberRows = (members as TeamMemberRow[] | null) ?? [];
  const userIds = memberRows
    .map((row) => row.user_id)
    .filter((id): id is string => Boolean(id));
  const [presenceMap, avatarMap] = await Promise.all([
    getPresenceForUserIds(userIds),
    getAvatarUrlsForUserIds(supabase, userIds),
  ]);

  const memberList = memberRows.map((row) =>
    mapTeamMemberRow(
      row,
      row.user_id ? (presenceMap.get(row.user_id) ?? "inactive") : "inactive",
      row.user_id ? (avatarMap.get(row.user_id) ?? null) : null
    )
  );
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

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(token)) return null;

  const { data, error } = await supabase.rpc("get_invitation_by_token", {
    p_token: token,
  });

  if (error || !data?.length) return null;

  const row = data[0] as {
    id: string;
    email: string;
    role: string;
    status: string;
    expires_at: string;
    organization_name: string;
  };

  return {
    id: row.id,
    email: row.email,
    role: row.role,
    organizationName: row.organization_name ?? "Organization",
    status: row.status,
    expiresAt: row.expires_at,
  };
}

export async function getPendingInvitationForUser(): Promise<string | null> {
  const invite = await getPendingInvitationDetails();
  return invite?.token ?? null;
}

export async function getPendingInvitationDetails(): Promise<{
  token: string;
  email: string;
  role: string;
  organizationName: string;
} | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const { data, error } = await supabase
    .from("team_invitations")
    .select("token, email, role, organizations ( name )")
    .eq("status", "pending")
    .ilike("email", user.email)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const org = Array.isArray(data.organizations)
    ? data.organizations[0]
    : data.organizations;

  return {
    token: data.token,
    email: data.email,
    role: data.role,
    organizationName: (org as { name: string } | null)?.name ?? "Organization",
  };
}
