import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import {
  type TeamRole,
  canManageTeam,
  canWriteData,
  permissionMatrix,
} from "@/lib/team";

export { canWriteData };

export async function getCurrentUserRole(): Promise<TeamRole | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const organizationId = await getOrganizationId();
  if (!organizationId) return null;

  const { data: ownedOrg } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (ownedOrg) return "owner";

  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  return (membership?.role as TeamRole) ?? null;
}

export async function requireWriteAccess(): Promise<{ error: string } | null> {
  const role = await getCurrentUserRole();
  if (!canWriteData(role)) {
    return {
      error: "You do not have permission to modify data. Viewers have read-only access.",
    };
  }
  return null;
}

export async function requireTeamManageAccess(): Promise<
  { error: string } | null
> {
  const role = await getCurrentUserRole();
  if (!canManageTeam(role)) {
    return {
      error: "You do not have permission to manage team members.",
    };
  }
  return null;
}

export function canManageOpportunities(role: TeamRole | null): boolean {
  return role === "owner" || role === "admin";
}

export function canApplyToOpportunities(role: TeamRole | null): boolean {
  return role === "owner" || role === "admin" || role === "manager";
}

export async function requireOpportunityManageAccess(): Promise<
  { error: string } | null
> {
  const role = await getCurrentUserRole();
  if (!canManageOpportunities(role)) {
    return {
      error: "You do not have permission to manage opportunities.",
    };
  }
  return null;
}

export async function requireApplicationAccess(): Promise<
  { error: string } | null
> {
  const role = await getCurrentUserRole();
  if (!canApplyToOpportunities(role)) {
    return {
      error: "You do not have permission to submit applications.",
    };
  }
  return null;
}

export function canViewSettings(role: TeamRole | null): boolean {
  if (!role) return false;
  return permissionMatrix[role].settings !== "none";
}

export function canManageSettings(role: TeamRole | null): boolean {
  return canManageTeam(role);
}

export async function requireSettingsManageAccess(): Promise<
  { error: string } | null
> {
  const role = await getCurrentUserRole();
  if (!canManageSettings(role)) {
    return {
      error: "You do not have permission to update organization settings.",
    };
  }
  return null;
}
