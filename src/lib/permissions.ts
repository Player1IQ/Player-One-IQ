import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/cached";
import {
  isRolePreviewAllowed,
  parseRolePreviewCookie,
  ROLE_PREVIEW_COOKIE,
} from "@/lib/dev/role-preview";
import { getOrganizationId } from "@/lib/organization/queries";
import { isSoloCreatorWorkspaceFounder } from "@/lib/organization/founder";
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
  isWorkspaceFounder: boolean;
}

export async function getCurrentUserMembership(): Promise<CurrentUserMembership | null> {
  return getCurrentUserMembershipCached();
}

const getCurrentUserMembershipCached = cache(
  async (): Promise<CurrentUserMembership | null> => {
  const supabase = await createClient();
  if (!supabase) return null;

  const user = await getAuthUser();
  if (!user) return null;

  const organizationId = await getOrganizationId();
  if (!organizationId) return null;

  const { data: organization } = await supabase
    .from("organizations")
    .select("user_id, type")
    .eq("id", organizationId)
    .maybeSingle();

  function withFounderFlag(
    membership: Omit<CurrentUserMembership, "isWorkspaceFounder">
  ): CurrentUserMembership {
    return {
      ...membership,
      isWorkspaceFounder: isSoloCreatorWorkspaceFounder({
        organizationType: organization?.type,
        organizationUserId: organization?.user_id,
        currentUserId: user.id,
        role: membership.role,
      }),
    };
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("role, linked_creator_id, linked_sponsor_id")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const memberRole = (membership?.role as TeamRole | undefined) ?? null;
  const portalRole =
    memberRole === "player" ||
    memberRole === "content_creator" ||
    memberRole === "sponsor"
      ? memberRole
      : null;

  if (portalRole) {
    return applyRolePreviewIfAllowed(
      withFounderFlag({
        role: portalRole,
        linkedCreatorId: membership?.linked_creator_id ?? null,
        linkedSponsorId: membership?.linked_sponsor_id ?? null,
      }),
      user.email
    );
  }

  const { data: ownedOrg } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (ownedOrg) {
    if (membership?.linked_creator_id || membership?.linked_sponsor_id) {
      return applyRolePreviewIfAllowed(
        withFounderFlag({
          role: (membership.role as TeamRole) ?? "owner",
          linkedCreatorId: membership.linked_creator_id ?? null,
          linkedSponsorId: membership.linked_sponsor_id ?? null,
        }),
        user.email
      );
    }
    return applyRolePreviewIfAllowed(
      withFounderFlag({
        role: "owner",
        linkedCreatorId: null,
        linkedSponsorId: null,
      }),
      user.email
    );
  }

  if (!membership?.role) return null;

  const baseMembership = withFounderFlag({
    role: membership.role as TeamRole,
    linkedCreatorId: membership.linked_creator_id ?? null,
    linkedSponsorId: membership.linked_sponsor_id ?? null,
  });

  return applyRolePreviewIfAllowed(baseMembership, user.email);
});

async function applyRolePreviewIfAllowed(
  membership: CurrentUserMembership,
  email: string | undefined
): Promise<CurrentUserMembership> {
  if (!email || !isRolePreviewAllowed(email)) return membership;

  const cookieStore = await cookies();
  const preview = parseRolePreviewCookie(
    cookieStore.get(ROLE_PREVIEW_COOKIE)?.value
  );
  if (!preview) return membership;

  return {
    role: preview.role,
    linkedCreatorId: preview.linkedCreatorId,
    linkedSponsorId: preview.linkedSponsorId,
    isWorkspaceFounder: membership.isWorkspaceFounder,
  };
}

export async function isRolePreviewActiveForCurrentUser(): Promise<boolean> {
  const user = await getAuthUser();
  if (!user?.email || !isRolePreviewAllowed(user.email)) return false;
  const cookieStore = await cookies();
  return Boolean(cookieStore.get(ROLE_PREVIEW_COOKIE)?.value);
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

export async function requireCreatorPlatformConnectAccess(
  creatorId: string
): Promise<{ error: string } | null> {
  const membership = await getCurrentUserMembership();
  if (membership && isCreatorPortalRole(membership.role)) {
    if (membership.linkedCreatorId !== creatorId) {
      return {
        error: "You can only connect platforms on your own creator profile.",
      };
    }
    return null;
  }

  return requireResourceWriteAccess("creators");
}

export async function requireCreatorRevenueWriteAccess(
  creatorId: string
): Promise<{ error: string } | null> {
  const membership = await getCurrentUserMembership();
  if (membership && isCreatorPortalRole(membership.role)) {
    if (membership.linkedCreatorId !== creatorId) {
      return {
        error: "You can only update revenue on your own creator profile.",
      };
    }
    return null;
  }

  return requireResourceWriteAccess("creators");
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
    role === "content_creator" ||
    role === "player"
  );
}

export function canAccessOpportunityAsPortal(
  membership: CurrentUserMembership | null,
  creatorId?: string
): boolean {
  if (!membership || !isCreatorPortalRole(membership.role)) return false;
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

export function canViewSettings(
  role: TeamRole | null,
  isWorkspaceFounder = false
): boolean {
  if (!role) return false;
  if (isWorkspaceFounder && isCreatorPortalRole(role)) return true;
  return permissionMatrix[role].settings !== "none";
}

export function canManageSettings(
  role: TeamRole | null,
  isWorkspaceFounder = false
): boolean {
  if (!role) return false;
  if (isWorkspaceFounder && isCreatorPortalRole(role)) return true;
  return hasFullAccess(role, "settings");
}

export async function requireSettingsManageAccess(): Promise<
  { error: string } | null
> {
  const membership = await getCurrentUserMembership();
  const role = membership?.role ?? (await getCurrentUserRole());
  if (!canManageSettings(role, membership?.isWorkspaceFounder)) {
    return {
      error: "You do not have permission to update organization settings.",
    };
  }
  return null;
}

export function canManageBilling(
  role: TeamRole | null,
  isWorkspaceFounder = false
): boolean {
  if (isWorkspaceFounder && isCreatorPortalRole(role)) return true;
  return role === "owner";
}

export function canViewBilling(
  role: TeamRole | null,
  isWorkspaceFounder = false
): boolean {
  if (!role) return false;
  if (isWorkspaceFounder && isCreatorPortalRole(role)) return true;
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
