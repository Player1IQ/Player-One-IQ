"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import {
  requireFeatureAccess,
  requireDealRoomEventAccess,
  requireMessagingAccess,
  requireMessagingWriteAccess,
  getCurrentUserMembership,
  canAccessContract,
} from "@/lib/permissions";
import {
  isCreatorPortalRole,
  isPortalRole,
  isSponsorPortalRole,
  type TeamRole,
} from "@/lib/team";
import {
  getCurrentUserId,
  getOrganizationUsers,
  getOrganizationUserIds,
  getConversationById,
  findConversationByRelated,
  getConversations,
} from "@/lib/messages/queries";
import {
  type ConversationType,
  displayNameForUser,
  truncatePreview,
} from "@/lib/messages";
import type { ActivityAction } from "@/lib/activity/queries";
import {
  dealRoomOpenedMessage,
  groupCreatedMessage,
  memberLeftMessage,
  memberRemovedMessage,
  membersAddedMessage,
} from "@/lib/messages/system-events";

async function logMessageActivity(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  organizationId: string,
  params: {
    entityId: string | null;
    action: ActivityAction;
    summary: string;
    detail?: string;
  }
) {
  await supabase.from("activity_log").insert({
    organization_id: organizationId,
    entity_type: "message",
    entity_id: params.entityId,
    action: params.action,
    summary: params.summary,
    detail: params.detail ?? null,
  });
}

const CREATOR_PORTAL_ROLES = ["player", "content_creator"] as const;

async function getDealRoomParticipantUserIds(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  organizationId: string,
  type: "contract" | "opportunity",
  relatedId: string | null
): Promise<string[]> {
  if (!relatedId) return [];

  let creatorId: string | null = null;
  let sponsorId: string | null = null;

  if (type === "contract") {
    const { data } = await supabase
      .from("contracts")
      .select("creator_id, sponsor_id")
      .eq("id", relatedId)
      .eq("organization_id", organizationId)
      .maybeSingle();
    creatorId = data?.creator_id ?? null;
    sponsorId = data?.sponsor_id ?? null;
  } else {
    const { data } = await supabase
      .from("opportunities")
      .select("sponsor_id")
      .eq("id", relatedId)
      .eq("organization_id", organizationId)
      .maybeSingle();
    sponsorId = data?.sponsor_id ?? null;
  }

  const [{ data: members }, { data: org }] = await Promise.all([
    supabase
      .from("team_members")
      .select("user_id, role, linked_creator_id, linked_sponsor_id")
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .not("user_id", "is", null),
    supabase
      .from("organizations")
      .select("user_id")
      .eq("id", organizationId)
      .maybeSingle(),
  ]);

  const userIds = new Set<string>();
  if (org?.user_id) userIds.add(org.user_id);

  for (const member of members ?? []) {
    if (!member.user_id) continue;
    const memberRole = member.role as TeamRole;

    if (memberRole === "sponsor") {
      if (sponsorId && member.linked_sponsor_id === sponsorId) {
        userIds.add(member.user_id);
      }
      continue;
    }

    const isCreatorPortal = CREATOR_PORTAL_ROLES.includes(
      memberRole as (typeof CREATOR_PORTAL_ROLES)[number]
    );

    if (type === "opportunity") {
      if (!isCreatorPortal) userIds.add(member.user_id);
      continue;
    }

    if (!isCreatorPortal) {
      userIds.add(member.user_id);
    } else if (creatorId && member.linked_creator_id === creatorId) {
      userIds.add(member.user_id);
    }
  }

  return [...userIds];
}

async function syncDealRoomParticipants(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  conversationId: string
): Promise<{ error?: string }> {
  const { data: conversation } = await supabase
    .from("conversations")
    .select("type, related_id, organization_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation) return { error: "Conversation not found." };
  if (conversation.type !== "contract" && conversation.type !== "opportunity") {
    return {};
  }

  const currentUserId = await getCurrentUserId();
  if (currentUserId) {
    const selfResult = await ensureParticipant(
      supabase,
      conversationId,
      currentUserId
    );
    if (selfResult.error) return selfResult;
  }

  const userIds = await getDealRoomParticipantUserIds(
    supabase,
    conversation.organization_id,
    conversation.type,
    conversation.related_id
  );

  for (const userId of userIds) {
    if (userId === currentUserId) continue;
    const result = await ensureParticipant(supabase, conversationId, userId);
    if (result.error) return result;
  }

  return {};
}

async function ensureUserOnCreatorContractDealRooms(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  organizationId: string,
  userId: string,
  creatorId: string
): Promise<{ error?: string; synced?: number }> {
  const { data: contracts } = await supabase
    .from("contracts")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("creator_id", creatorId);

  if (!contracts?.length) return { synced: 0 };

  const contractIds = contracts.map((row) => row.id);
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("type", "contract")
    .in("related_id", contractIds);

  let synced = 0;
  for (const conversation of conversations ?? []) {
    const result = await ensureParticipant(
      supabase,
      conversation.id,
      userId
    );
    if (result.error) return result;
    synced += 1;
  }

  return { synced };
}

async function ensureUserOnSponsorDealRooms(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  organizationId: string,
  userId: string,
  sponsorId: string
): Promise<{ error?: string; synced?: number }> {
  const { data: contracts } = await supabase
    .from("contracts")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("sponsor_id", sponsorId);

  const contractIds = (contracts ?? []).map((row) => row.id);
  const conversationIds = new Set<string>();

  if (contractIds.length > 0) {
    const { data: contractConversations } = await supabase
      .from("conversations")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("type", "contract")
      .in("related_id", contractIds);

    for (const conversation of contractConversations ?? []) {
      conversationIds.add(conversation.id);
    }
  }

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("sponsor_id", sponsorId);

  const opportunityIds = (opportunities ?? []).map((row) => row.id);

  if (opportunityIds.length > 0) {
    const { data: opportunityConversations } = await supabase
      .from("conversations")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("type", "opportunity")
      .in("related_id", opportunityIds);

    for (const conversation of opportunityConversations ?? []) {
      conversationIds.add(conversation.id);
    }
  }

  let synced = 0;
  for (const conversationId of conversationIds) {
    const result = await ensureParticipant(supabase, conversationId, userId);
    if (result.error) return result;
    synced += 1;
  }

  return { synced };
}

export async function syncPortalUserToContractDealRooms(
  creatorId: string,
  organizationIdOverride?: string,
  options?: { revalidate?: boolean }
): Promise<{ error?: string; synced?: number }> {
  const messagingError = await requireMessagingAccess();
  if (messagingError) return messagingError;

  const featureError = await requireFeatureAccess("messaging", "Messaging");
  if (featureError) return featureError;

  const membership = await getCurrentUserMembership();
  if (!membership || !isCreatorPortalRole(membership.role)) {
    return { error: "Only creator portal users can sync contract deal rooms." };
  }
  if (membership.linkedCreatorId !== creatorId) {
    return { error: "You do not have access to this creator's deal rooms." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId =
    organizationIdOverride ?? (await getOrganizationId());
  if (!organizationId) return { error: "Organization not found." };

  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { error: "Not authenticated." };

  const result = await ensureUserOnCreatorContractDealRooms(
    supabase,
    organizationId,
    currentUserId,
    creatorId
  );
  if (result.error) return result;

  if (options?.revalidate !== false) {
    revalidatePath("/messages");
    revalidatePath("/portal");
  }
  return result;
}

export async function bootstrapPortalUserContractDealRooms(
  organizationId: string,
  userId: string,
  creatorId: string
): Promise<{ error?: string; synced?: number }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const result = await ensureUserOnCreatorContractDealRooms(
    supabase,
    organizationId,
    userId,
    creatorId
  );
  if (result.error) return result;

  revalidatePath("/messages");
  revalidatePath("/portal");
  return result;
}

export async function syncPortalUserToSponsorDealRooms(
  sponsorId: string,
  organizationIdOverride?: string,
  options?: { revalidate?: boolean }
): Promise<{ error?: string; synced?: number }> {
  const messagingError = await requireMessagingAccess();
  if (messagingError) return messagingError;

  const featureError = await requireFeatureAccess("messaging", "Messaging");
  if (featureError) return featureError;

  const membership = await getCurrentUserMembership();
  if (!membership || !isSponsorPortalRole(membership.role)) {
    return { error: "Only sponsor portal users can sync sponsor deal rooms." };
  }
  if (membership.linkedSponsorId !== sponsorId) {
    return { error: "You do not have access to this sponsor's deal rooms." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId =
    organizationIdOverride ?? (await getOrganizationId());
  if (!organizationId) return { error: "Organization not found." };

  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { error: "Not authenticated." };

  const result = await ensureUserOnSponsorDealRooms(
    supabase,
    organizationId,
    currentUserId,
    sponsorId
  );
  if (result.error) return result;

  if (options?.revalidate !== false) {
    revalidatePath("/messages");
    revalidatePath("/portal");
  }
  return result;
}

export async function bootstrapPortalUserSponsorDealRooms(
  organizationId: string,
  userId: string,
  sponsorId: string
): Promise<{ error?: string; synced?: number }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const result = await ensureUserOnSponsorDealRooms(
    supabase,
    organizationId,
    userId,
    sponsorId
  );
  if (result.error) return result;

  revalidatePath("/messages");
  revalidatePath("/portal");
  return result;
}

function validateOrgMemberIds(
  memberIds: string[],
  allowedUserIds: string[],
  currentUserId: string
): string | null {
  const allowed = new Set(allowedUserIds);
  allowed.add(currentUserId);

  for (const id of memberIds) {
    if (!allowed.has(id)) {
      return "One or more selected members are not in your organization.";
    }
  }

  return null;
}

async function ensureParticipant(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  conversationId: string,
  userId: string
): Promise<{ error?: string }> {
  const { error } = await supabase.rpc("ensure_conversation_participant", {
    p_conversation_id: conversationId,
    p_user_id: userId,
  });

  if (error) return { error: error.message };
  return {};
}

async function postConversationSystemEvent(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  conversationId: string,
  content: string,
  actorUserId: string
): Promise<{ error?: string }> {
  const trimmed = content.trim();
  if (!trimmed) return {};

  const participantResult = await ensureParticipant(
    supabase,
    conversationId,
    actorUserId
  );
  if (participantResult.error) return participantResult;

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: actorUserId,
    content: trimmed,
    message_kind: "system",
  });

  if (error) return { error: error.message };
  return {};
}

export async function notifyDealRoom(conversationId: string, content: string) {
  const permError = await requireDealRoomEventAccess();
  if (permError) return permError;

  const featureError = await requireFeatureAccess("messaging", "Messaging");
  if (featureError) return featureError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { error: "Not authenticated." };

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!conversation) return { error: "Conversation not found." };

  const result = await postConversationSystemEvent(
    supabase,
    conversationId,
    content,
    currentUserId
  );
  if (result.error) return { error: result.error };

  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);
  return { success: true as const };
}

export async function getOrCreateDirectConversation(otherUserId: string) {
  const messagingError = await requireMessagingAccess();
  if (messagingError) return messagingError;

  const featureError = await requireFeatureAccess("messaging", "Messaging");
  if (featureError) return featureError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { error: "Not authenticated." };

  if (otherUserId === currentUserId) {
    return { error: "You cannot message yourself." };
  }

  const orgUsers = await getOrganizationUsers();
  const otherUser = orgUsers.find((user) => user.userId === otherUserId);
  if (!otherUser) {
    return { error: "User is not in your organization." };
  }

  const membership = await getCurrentUserMembership();
  if (
    membership &&
    isPortalRole(membership.role) &&
    isPortalRole(otherUser.role as TeamRole)
  ) {
    return { error: "Portal users can only message agency staff." };
  }

  const { data: directConversations } = await supabase
    .from("conversations")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("type", "direct");

  for (const conversation of directConversations ?? []) {
    await supabase.rpc("repair_direct_conversation_participants", {
      p_conversation_id: conversation.id,
    });

    const { data: participantIds } = await supabase.rpc(
      "get_conversation_participant_user_ids",
      { p_conversation_id: conversation.id }
    );

    const userIds = (participantIds ?? []) as string[];
    if (userIds.includes(currentUserId) && userIds.includes(otherUserId)) {
      return { id: conversation.id };
    }
  }

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({
      organization_id: organizationId,
      type: "direct",
      related_id: null,
    })
    .select("id")
    .single();

  if (error || !created) return { error: error?.message ?? "Failed to create conversation." };

  const selfParticipant = await ensureParticipant(
    supabase,
    created.id,
    currentUserId
  );
  if (selfParticipant.error) return { error: selfParticipant.error };

  const otherParticipant = await ensureParticipant(
    supabase,
    created.id,
    otherUserId
  );
  if (otherParticipant.error) return { error: otherParticipant.error };

  revalidatePath("/messages");
  return { id: created.id };
}

export async function createGroupConversation(
  title: string,
  memberIds: string[]
) {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) return { error: "Group name is required." };

  const role = (await getCurrentUserMembership())?.role ?? null;
  if (isPortalRole(role)) {
    return { error: "Portal users cannot create group chats." };
  }

  const permError = await requireMessagingWriteAccess();
  if (permError) return permError;

  const featureError = await requireFeatureAccess("messaging", "Messaging");
  if (featureError) return featureError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { error: "Not authenticated." };

  const allowedUserIds = await getOrganizationUserIds();
  const orgUsers = await getOrganizationUsers();
  const uniqueMemberIds = [...new Set(memberIds.filter((id) => id !== currentUserId))];
  const validationError = validateOrgMemberIds(
    uniqueMemberIds,
    allowedUserIds,
    currentUserId
  );
  if (validationError) return { error: validationError };

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({
      organization_id: organizationId,
      type: "group",
      related_id: null,
      title: trimmedTitle,
      created_by: currentUserId,
    })
    .select("id")
    .single();

  if (error || !created) {
    return { error: error?.message ?? "Failed to create group chat." };
  }

  const { error: adminError } = await supabase
    .from("conversation_participants")
    .insert({
      conversation_id: created.id,
      user_id: currentUserId,
      role: "admin",
    });

  if (adminError) {
    return { error: adminError.message };
  }

  for (const userId of uniqueMemberIds) {
    const result = await ensureParticipant(supabase, created.id, userId);
    if (result.error) return { error: result.error };
  }

  const addedNames = uniqueMemberIds
    .map((id) => orgUsers.find((user) => user.userId === id)?.name)
    .filter((name): name is string => Boolean(name));

  await postConversationSystemEvent(
    supabase,
    created.id,
    groupCreatedMessage(trimmedTitle),
    currentUserId
  );

  if (addedNames.length > 0) {
    await postConversationSystemEvent(
      supabase,
      created.id,
      membersAddedMessage(addedNames),
      currentUserId
    );
  }

  await logMessageActivity(supabase, organizationId, {
    entityId: created.id,
    action: "created",
    summary: "Group chat created",
    detail: trimmedTitle,
  });

  revalidatePath("/messages");
  return { id: created.id };
}

export async function addConversationParticipants(
  conversationId: string,
  userIds: string[]
) {
  const permError = await requireMessagingWriteAccess();
  if (permError) return permError;

  const featureError = await requireFeatureAccess("messaging", "Messaging");
  if (featureError) return featureError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { error: "Not authenticated." };

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, type, title")
    .eq("id", conversationId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!conversation) return { error: "Conversation not found." };
  if (conversation.type === "direct") {
    return { error: "Cannot add members to a direct message." };
  }

  const orgUsers = await getOrganizationUsers();
  const allowedUserIds = await getOrganizationUserIds();
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  const validationError = validateOrgMemberIds(
    uniqueIds,
    allowedUserIds,
    currentUserId
  );
  if (validationError) return { error: validationError };

  const { data: selfParticipant } = await supabase
    .from("conversation_participants")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("user_id", currentUserId)
    .maybeSingle();

  if (!selfParticipant) {
    return { error: "You are not a participant in this conversation." };
  }

  let added = 0;
  for (const userId of uniqueIds) {
    const { data: existing } = await supabase
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) continue;

    const result = await ensureParticipant(supabase, conversationId, userId);
    if (result.error) return { error: result.error };
    added += 1;
  }

  if (added > 0) {
    const names = uniqueIds
      .map((id) => orgUsers.find((user) => user.userId === id)?.name)
      .filter((name): name is string => Boolean(name));

    await postConversationSystemEvent(
      supabase,
      conversationId,
      membersAddedMessage(names),
      currentUserId
    );

    await logMessageActivity(supabase, organizationId, {
      entityId: conversationId,
      action: "updated",
      summary: "Members added to conversation",
      detail: names.join(", ") || `${added} member(s)`,
    });
  }

  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);
  return { success: true as const, added };
}

export async function removeConversationParticipant(
  conversationId: string,
  userId: string
) {
  const permError = await requireMessagingWriteAccess();
  if (permError) return permError;

  const featureError = await requireFeatureAccess("messaging", "Messaging");
  if (featureError) return featureError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { error: "Not authenticated." };

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, type")
    .eq("id", conversationId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!conversation) return { error: "Conversation not found." };
  if (conversation.type === "direct") {
    return { error: "Cannot remove members from a direct message." };
  }

  const { error } = await supabase.rpc("remove_conversation_participant", {
    p_conversation_id: conversationId,
    p_user_id: userId,
  });

  if (error) return { error: error.message };

  const orgUsers = await getOrganizationUsers();
  const removedName =
    orgUsers.find((user) => user.userId === userId)?.name ?? "Member";

  await postConversationSystemEvent(
    supabase,
    conversationId,
    userId === currentUserId
      ? memberLeftMessage(removedName)
      : memberRemovedMessage(removedName),
    currentUserId
  );

  await logMessageActivity(supabase, organizationId, {
    entityId: conversationId,
    action: "updated",
    summary:
      userId === currentUserId
        ? "Left conversation"
        : "Member removed from conversation",
    detail: removedName,
  });

  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);

  if (userId === currentUserId) {
    return { success: true as const, left: true as const };
  }

  return { success: true as const, left: false as const };
}

export async function syncConversationParticipants(conversationId: string) {
  const permError = await requireDealRoomEventAccess();
  if (permError) return permError;

  const featureError = await requireFeatureAccess("messaging", "Messaging");
  if (featureError) return featureError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { error: "Not authenticated." };

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, type")
    .eq("id", conversationId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!conversation) return { error: "Conversation not found." };
  if (conversation.type !== "opportunity" && conversation.type !== "contract") {
    return { error: "Only deal rooms can sync the full team." };
  }

  const result = await syncDealRoomParticipants(supabase, conversationId);
  if (result.error) return { error: result.error };

  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);
  return { success: true as const };
}

export async function getOrCreateRelatedConversation(
  type: Exclude<ConversationType, "direct" | "group">,
  relatedId: string
) {
  const membership = await getCurrentUserMembership();
  if (!membership) return { error: "Not authenticated." };

  if (isPortalRole(membership.role)) {
    if (type !== "contract") {
      return { error: "You do not have permission to open this deal room." };
    }

    const messagingError = await requireMessagingAccess();
    if (messagingError) return messagingError;
  } else {
    const messagingError = await requireMessagingAccess();
    if (messagingError) return messagingError;
  }

  const featureError = await requireFeatureAccess("messaging", "Messaging");
  if (featureError) return featureError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { error: "Not authenticated." };

  let relatedTitle = "";
  if (type === "contract") {
    const { data: contract } = await supabase
      .from("contracts")
      .select("id, contract_name, creator_id, sponsor_id")
      .eq("id", relatedId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (!contract) {
      return { error: "Contract not found." };
    }

    if (isPortalRole(membership.role)) {
      if (
        !(await canAccessContract({
          creatorId: contract.creator_id,
          sponsorId: contract.sponsor_id,
        }))
      ) {
        return { error: "You do not have permission to open this deal room." };
      }
    }

    relatedTitle = contract.contract_name;
  } else {
    const { data: opportunity } = await supabase
      .from("opportunities")
      .select("id, title")
      .eq("id", relatedId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (!opportunity) {
      return { error: "Opportunity not found." };
    }

    relatedTitle = opportunity.title;
  }

  const existingId = await findConversationByRelated(type, relatedId);
  if (existingId) {
    const participantResult = await ensureParticipant(
      supabase,
      existingId,
      currentUserId
    );
    if (participantResult.error) return { error: participantResult.error };

    const syncResult = await syncDealRoomParticipants(supabase, existingId);
    if (syncResult.error) return { error: syncResult.error };

    revalidatePath("/messages");
    revalidatePath(`/messages/${existingId}`);
    return { id: existingId };
  }

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({
      organization_id: organizationId,
      type,
      related_id: relatedId,
    })
    .select("id")
    .single();

  if (error || !created) {
    return { error: error?.message ?? "Failed to create conversation." };
  }

  const participantsResult = await syncDealRoomParticipants(supabase, created.id);
  if (participantsResult.error) return { error: participantsResult.error };

  const title = relatedTitle;

  await postConversationSystemEvent(
    supabase,
    created.id,
    dealRoomOpenedMessage(
      type === "opportunity" ? "Opportunity" : "Contract"
    ),
    currentUserId
  );

  await logMessageActivity(supabase, organizationId, {
    entityId: created.id,
    action: "created",
    summary: `${type === "opportunity" ? "Opportunity" : "Contract"} deal room opened`,
    detail: title,
  });

  revalidatePath("/messages");
  revalidatePath("/");
  return { id: created.id };
}

export async function sendMessage(conversationId: string, content: string) {
  const trimmed = content.trim();
  if (!trimmed) return { error: "Message cannot be empty." };

  const permError = await requireMessagingAccess();
  if (permError) return permError;

  const featureError = await requireFeatureAccess("messaging", "Messaging");
  if (featureError) return featureError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { error: "Not authenticated." };

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, type, related_id")
    .eq("id", conversationId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!conversation) return { error: "Conversation not found." };

  let { data: participant } = await supabase
    .from("conversation_participants")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("user_id", currentUserId)
    .maybeSingle();

  if (!participant) {
    const { error: ensureError } = await supabase.rpc(
      "ensure_conversation_participant",
      {
        p_conversation_id: conversationId,
        p_user_id: currentUserId,
      }
    );

    if (!ensureError) {
      const retry = await supabase
        .from("conversation_participants")
        .select("id")
        .eq("conversation_id", conversationId)
        .eq("user_id", currentUserId)
        .maybeSingle();
      participant = retry.data;
    }
  }

  if (!participant) {
    return { error: "You are not a participant in this conversation." };
  }

  if (conversation.type === "direct") {
    await supabase.rpc("repair_direct_conversation_participants", {
      p_conversation_id: conversationId,
    });
  }

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: trimmed,
      message_kind: "user",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", currentUserId);

  await logMessageActivity(supabase, organizationId, {
    entityId: conversationId,
    action: "created",
    summary: "New message sent",
    detail: trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed,
  });

  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/");
  return { id: message.id };
}

export async function markConversationRead(conversationId: string) {
  const permError = await requireMessagingAccess();
  if (permError) return permError;

  const featureError = await requireFeatureAccess("messaging", "Messaging");
  if (featureError) return featureError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", currentUserId);

  if (error) return { error: error.message };

  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);
  return { success: true };
}

export async function fetchMessageNotificationDetails(
  conversationId: string,
  messageId: string
) {
  const featureError = await requireFeatureAccess("messaging", "Messaging");
  if (featureError) return featureError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { error: "Not authenticated." };

  const { data: participant } = await supabase
    .from("conversation_participants")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("user_id", currentUserId)
    .maybeSingle();

  if (!participant) return { error: "Not a participant." };

  const { data: message } = await supabase
    .from("messages")
    .select("id, sender_id, content")
    .eq("id", messageId)
    .eq("conversation_id", conversationId)
    .maybeSingle();

  if (!message) return { error: "Message not found." };
  if (message.sender_id === currentUserId) return { error: "Own message." };

  const conversation = await getConversationById(conversationId);
  if (!conversation) return { error: "Conversation not found." };

  const users = await getOrganizationUsers();
  const usersById = new Map(users.map((user) => [user.userId, user]));

  return {
    title: conversation.title,
    senderName: displayNameForUser(message.sender_id, usersById),
    preview: truncatePreview(message.content),
  };
}

export type UnreadConversationPreview = {
  id: string;
  title: string;
  subtitle: string;
  lastMessage: string | null;
  unreadCount: number;
  updatedAtDisplay: string;
};

export async function fetchUnreadConversationPreviews(): Promise<
  UnreadConversationPreview[]
> {
  const featureError = await requireFeatureAccess("messaging", "Messaging");
  if (featureError) return [];

  const conversations = await getConversations();

  return conversations
    .filter((conversation) => conversation.unreadCount > 0)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 5)
    .map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
      subtitle: conversation.subtitle,
      lastMessage: conversation.lastMessage,
      unreadCount: conversation.unreadCount,
      updatedAtDisplay: conversation.updatedAtDisplay,
    }));
}

export async function fetchUnreadMessageCount() {
  const featureError = await requireFeatureAccess("messaging", "Messaging");
  if (featureError) return 0;

  const supabase = await createClient();
  if (!supabase) return 0;

  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return 0;

  const { data: participantRows } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at")
    .eq("user_id", currentUserId);

  if (!participantRows?.length) return 0;

  let unread = 0;

  for (const participant of participantRows) {
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", participant.conversation_id)
      .neq("sender_id", currentUserId)
      .gt("created_at", participant.last_read_at);

    unread += count ?? 0;
  }

  return unread;
}
