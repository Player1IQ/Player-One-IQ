import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import {
  getLimitForMetric,
  hasAnyFeature,
  hasFeature,
  isWithinLimit,
} from "@/lib/subscription/features";
import { getSubscriptionContext } from "@/lib/subscription/queries";
import type { FeatureKey, UsageMetricKey } from "@/lib/subscription/types";
import {
  type TeamRole,
  type PermissionKey,
  canManageTeam,
  canWriteData,
  canUseMessaging,
  hasFullAccess,
  hasReadAccess,
  isPortalRole,
  permissionMatrix,
} from "@/lib/team";

export { canWriteData, canUseMessaging, isPortalRole, hasFullAccess, hasReadAccess };

export interface CurrentUserMembership {
  role: TeamRole;
  linkedCreatorId: string | null;
}

export async function getCurrentUserMembership(): Promise<CurrentUserMembership | null> {
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

  if (ownedOrg) {
    return { role: "owner", linkedCreatorId: null };
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("role, linked_creator_id")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!membership?.role) return null;

  return {
    role: membership.role as TeamRole,
    linkedCreatorId: membership.linked_creator_id ?? null,
  };
}

export async function getCurrentUserRole(): Promise<TeamRole | null> {
  const membership = await getCurrentUserMembership();
  return membership?.role ?? null;
}

export async function getLinkedCreatorId(): Promise<string | null> {
  const membership = await getCurrentUserMembership();
  return membership?.linkedCreatorId ?? null;
}

export async function canAccessCreator(creatorId: string): Promise<boolean> {
  const membership = await getCurrentUserMembership();
  if (!membership) return false;

  if (isPortalRole(membership.role)) {
    return membership.linkedCreatorId === creatorId;
  }

  return hasReadAccess(membership.role, "creators");
}

export async function canAccessContract(contract: {
  creatorId: string;
}): Promise<boolean> {
  const membership = await getCurrentUserMembership();
  if (!membership) return false;

  if (isPortalRole(membership.role)) {
    return membership.linkedCreatorId === contract.creatorId;
  }

  return hasReadAccess(membership.role, "contracts");
}

export async function requireWriteAccess(): Promise<{ error: string } | null> {
  const role = await getCurrentUserRole();
  if (!canWriteData(role)) {
    return {
      error: "You do not have permission to modify data.",
    };
  }
  return null;
}

export async function requireMessagingAccess(): Promise<{ error: string } | null> {
  const role = await getCurrentUserRole();
  if (!canUseMessaging(role)) {
    return {
      error: "You do not have permission to use messaging.",
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
  return (
    role === "owner" ||
    role === "admin" ||
    role === "partnerships"
  );
}

export function canApplyToOpportunities(role: TeamRole | null): boolean {
  return (
    role === "owner" ||
    role === "admin" ||
    role === "manager" ||
    role === "talent_manager"
  );
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
  if (!role) return false;
  return hasFullAccess(role, "settings");
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

export function canManageBilling(role: TeamRole | null): boolean {
  return role === "owner";
}

export function canViewBilling(role: TeamRole | null): boolean {
  if (!role) return false;
  return permissionMatrix[role].billing !== "none";
}

export async function requireBillingManageAccess(): Promise<
  { error: string } | null
> {
  const role = await getCurrentUserRole();
  if (!canManageBilling(role)) {
    return {
      error: "You do not have permission to manage billing.",
    };
  }
  return null;
}

export async function requireFeatureAccess(
  features: FeatureKey | FeatureKey[],
  featureLabel?: string
): Promise<{ error: string; upgradeRequired?: boolean } | null> {
  const context = await getSubscriptionContext();
  const keys = Array.isArray(features) ? features : [features];
  const allowed = hasAnyFeature(context.features, keys);

  if (!allowed) {
    const label = featureLabel ?? keys.map((k) => k.replace(/_/g, " ")).join(", ");
    return {
      error: `${label} is not included in your current plan. Upgrade to unlock this feature.`,
      upgradeRequired: true,
    };
  }
  return null;
}

export async function requireUsageWithinLimit(
  metric: UsageMetricKey,
  currentCount: number,
  resourceLabel: string
): Promise<{ error: string; upgradeRequired?: boolean } | null> {
  const context = await getSubscriptionContext();
  const limit = getLimitForMetric(context.limits, metric);

  if (!isWithinLimit(currentCount, limit)) {
    return {
      error: `Your plan allows up to ${limit} ${resourceLabel}. Upgrade to add more.`,
      upgradeRequired: true,
    };
  }
  return null;
}

export async function canAccessFeature(
  feature: FeatureKey
): Promise<boolean> {
  const context = await getSubscriptionContext();
  return hasFeature(context.features, feature);
}

export function canAccessAgencyArea(
  role: TeamRole | null,
  key: PermissionKey
): boolean {
  if (!role) return false;
  if (isPortalRole(role)) return false;
  return hasReadAccess(role, key);
}
