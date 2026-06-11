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

export function canManageBilling(role: TeamRole | null): boolean {
  return canManageTeam(role);
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
