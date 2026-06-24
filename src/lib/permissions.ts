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
  isCreatorPortalRole,
  isPortalRole,
  isSponsorPortalRole,
  permissionMatrix,
} from "@/lib/team";

export {
  canWriteData,
  canUseMessaging,
  isPortalRole,
  isCreatorPortalRole,
  isSponsorPortalRole,
  hasFullAccess,
  hasReadAccess,
};

export interface CurrentUserMembership {
  role: TeamRole;
  linkedCreatorId: string | null;
  linkedSponsorId: string | null;
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
    return { role: "owner", linkedCreatorId: null, linkedSponsorId: null };
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("role, linked_creator_id, linked_sponsor_id")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!membership?.role) return null;

  return {
    role: membership.role as TeamRole,
    linkedCreatorId: membership.linked_creator_id ?? null,
    linkedSponsorId: membership.linked_sponsor_id ?? null,
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

export async function getLinkedSponsorId(): Promise<string | null> {
  const membership = await getCurrentUserMembership();
  return membership?.linkedSponsorId ?? null;
}

export async function canAccessCreator(creatorId: string): Promise<boolean> {
  const membership = await getCurrentUserMembership();
  if (!membership) return false;

  if (isCreatorPortalRole(membership.role)) {
    return membership.linkedCreatorId === creatorId;
  }

  if (isSponsorPortalRole(membership.role)) {
    return false;
  }

  return hasReadAccess(membership.role, "creators");
}

export async function canAccessSponsor(sponsorId: string): Promise<boolean> {
  const membership = await getCurrentUserMembership();
  if (!membership) return false;

  if (isSponsorPortalRole(membership.role)) {
    return membership.linkedSponsorId === sponsorId;
  }

  return hasReadAccess(membership.role, "sponsors");
}

export async function canAccessContract(contract: {
  creatorId: string;
  sponsorId: string;
}): Promise<boolean> {
  const membership = await getCurrentUserMembership();
  if (!membership) return false;

  if (isCreatorPortalRole(membership.role)) {
    return membership.linkedCreatorId === contract.creatorId;
  }

  if (isSponsorPortalRole(membership.role)) {
    return membership.linkedSponsorId === contract.sponsorId;
  }

  return hasReadAccess(membership.role, "contracts");
}

export function canWriteResource(
  role: TeamRole | null,
  key: PermissionKey
): boolean {
  return hasFullAccess(role, key);
}

export async function requireResourceWriteAccess(
  key: PermissionKey
): Promise<{ error: string } | null> {
  const role = await getCurrentUserRole();
  if (!canWriteResource(role, key)) {
    return {
      error: "You do not have permission to modify this data.",
    };
  }
  return null;
}

export function canPostDealRoomEvents(role: TeamRole | null): boolean {
  if (!role || isPortalRole(role)) return false;
  return (
    hasFullAccess(role, "messages") ||
    hasFullAccess(role, "contracts") ||
    hasFullAccess(role, "opportunities")
  );
}

export async function requireDealRoomEventAccess(): Promise<
  { error: string } | null
> {
  const role = await getCurrentUserRole();
  if (!canPostDealRoomEvents(role)) {
    return {
      error: "You do not have permission to post deal room updates.",
    };
  }
  return null;
}

export async function requireMessagingWriteAccess(): Promise<
  { error: string } | null
> {
  const role = await getCurrentUserRole();
  if (!hasFullAccess(role, "messages")) {
    return {
      error: "You do not have permission to manage messaging.",
    };
  }
  return null;
}

export function canUpdateDeliverable(
  membership: CurrentUserMembership | null,
  contract: { creatorId: string }
): boolean {
  if (!membership) return false;

  if (hasFullAccess(membership.role, "contracts")) return true;

  if (isCreatorPortalRole(membership.role)) {
    return membership.linkedCreatorId === contract.creatorId;
  }

  return false;
}

export async function requireDeliverableUpdateAccess(
  contractId: string
): Promise<{ error: string } | null> {
  const membership = await getCurrentUserMembership();
  if (!membership) {
    return { error: "You do not have permission to update deliverables." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { data: contract } = await supabase
    .from("contracts")
    .select("creator_id")
    .eq("id", contractId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!contract) return { error: "Contract not found." };

  if (
    !canUpdateDeliverable(membership, { creatorId: contract.creator_id })
  ) {
    return { error: "You do not have permission to update deliverables." };
  }

  return null;
}

export async function canAccessConversation(
  conversationId: string
): Promise<boolean> {
  const membership = await getCurrentUserMembership();
  if (!membership || !canUseMessaging(membership.role)) return false;

  const supabase = await createClient();
  if (!supabase) return false;

  const organizationId = await getOrganizationId();
  if (!organizationId) return false;

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, organization_id")
    .eq("id", conversationId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!conversation) return false;

  if (isPortalRole(membership.role)) {
    const currentUserId = (
      await supabase.auth.getUser()
    ).data.user?.id;
    if (!currentUserId) return false;

    const { data: participant } = await supabase
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", currentUserId)
      .maybeSingle();

    return Boolean(participant);
  }

  return hasReadAccess(membership.role, "messages");
}

export async function canAccessCampaign(campaignId: string): Promise<boolean> {
  const membership = await getCurrentUserMembership();
  if (!membership) return false;

  if (membership.role === "player") return false;

  if (isCreatorPortalRole(membership.role)) {
    if (!membership.linkedCreatorId) return false;
    const { isCreatorAssignedToCampaign } = await import(
      "@/lib/campaigns/creator-sync"
    );
    return isCreatorAssignedToCampaign(campaignId, membership.linkedCreatorId);
  }

  if (isSponsorPortalRole(membership.role)) {
    if (!membership.linkedSponsorId) return false;
    const supabase = await createClient();
    if (!supabase) return false;
    const organizationId = await getOrganizationId();
    if (!organizationId) return false;
    const { data } = await supabase
      .from("sponsor_campaigns")
      .select("id")
      .eq("id", campaignId)
      .eq("organization_id", organizationId)
      .eq("sponsor_id", membership.linkedSponsorId)
      .maybeSingle();
    return Boolean(data);
  }

  return hasReadAccess(membership.role, "campaigns");
}

/** @deprecated Prefer requireResourceWriteAccess for resource-scoped checks. */
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
  return hasFullAccess(role, "opportunities");
}

export function canApplyToOpportunities(role: TeamRole | null): boolean {
  return (
    role === "owner" ||
    role === "admin" ||
    role === "manager" ||
    role === "talent_manager" ||
    role === "content_creator"
  );
}

export function canAccessOpportunityAsPortal(
  membership: CurrentUserMembership | null,
  creatorId?: string
): boolean {
  if (!membership || membership.role !== "content_creator") return false;
  if (!membership.linkedCreatorId) return false;
  if (creatorId !== undefined) {
    return membership.linkedCreatorId === creatorId;
  }
  return true;
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

export async function requirePortalApplicationAccess(
  creatorId: string
): Promise<{ error: string } | null> {
  const membership = await getCurrentUserMembership();
  if (!canAccessOpportunityAsPortal(membership, creatorId)) {
    return {
      error: "You do not have permission to access this application.",
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

export function canViewAi(role: TeamRole | null): boolean {
  return hasReadAccess(role, "ai");
}

export function canViewReports(role: TeamRole | null): boolean {
  return hasReadAccess(role, "reports");
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
