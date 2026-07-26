import { cache } from "react";
import { cookies } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_ORGANIZATION_COOKIE } from "@/lib/organization/context";
import { getAuthUser } from "@/lib/auth/cached";
import type { TeamRole } from "@/lib/team";

export interface AuthBootstrap {
  supabase: SupabaseClient;
  user: User;
  ownedOrganizationId: string | null;
  memberOrgIds: Set<string>;
  hasOrganization: boolean;
}

export interface ActiveOrgAccess {
  activeOrgId: string;
  role: TeamRole | null;
  linkedCreatorId: string | null;
  linkedSponsorId: string | null;
}

function resolveStaffRole(
  memberRole: string | null | undefined,
  isOwner: boolean
): TeamRole | null {
  const portalRole =
    memberRole === "player" ||
    memberRole === "content_creator" ||
    memberRole === "sponsor"
      ? (memberRole as TeamRole)
      : null;

  return portalRole ?? (isOwner ? "owner" : (memberRole as TeamRole | null));
}

/** Per-request org membership bootstrap for route guards. */
export const getAuthBootstrap = cache(async (): Promise<AuthBootstrap | null> => {
  const supabase = await createClient();
  if (!supabase) return null;

  const user = await getAuthUser();
  if (!user) return null;

  const [{ data: organization }, { data: memberships }] = await Promise.all([
    supabase
      .from("organizations")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("team_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "active"),
  ]);

  const memberOrgIds = new Set(
    (memberships ?? []).map((row) => row.organization_id)
  );

  return {
    supabase,
    user,
    ownedOrganizationId: organization?.id ?? null,
    memberOrgIds,
    hasOrganization: Boolean(organization) || memberOrgIds.size > 0,
  };
});

/** Per-request active org + role (single team_members lookup). */
export const getActiveOrgAccess = cache(async (): Promise<ActiveOrgAccess | null> => {
  const bootstrap = await getAuthBootstrap();
  if (!bootstrap) return null;

  const cookieStore = await cookies();
  const activeOrgId =
    cookieStore.get(ACTIVE_ORGANIZATION_COOKIE)?.value ??
    bootstrap.ownedOrganizationId ??
    [...bootstrap.memberOrgIds][0] ??
    null;

  if (!activeOrgId) return null;

  const isOwner = bootstrap.ownedOrganizationId === activeOrgId;
  const { data: member } = await bootstrap.supabase
    .from("team_members")
    .select("role, linked_creator_id, linked_sponsor_id")
    .eq("user_id", bootstrap.user.id)
    .eq("organization_id", activeOrgId)
    .eq("status", "active")
    .maybeSingle();

  return {
    activeOrgId,
    role: resolveStaffRole(member?.role, isOwner),
    linkedCreatorId: member?.linked_creator_id ?? null,
    linkedSponsorId: member?.linked_sponsor_id ?? null,
  };
});
