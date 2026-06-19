"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import {
  requireFeatureAccess,
  requireWriteAccess,
} from "@/lib/permissions";
import {
  getCurrentUserId,
  getOrganizationUsers,
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

async function addOrgParticipants(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  conversationId: string
): Promise<{ error?: string }> {
  const currentUserId = await getCurrentUserId();
  const users = await getOrganizationUsers();
  if (users.length === 0) return {};

  if (currentUserId) {
    const selfResult = await ensureParticipant(
      supabase,
      conversationId,
      currentUserId
    );
    if (selfResult.error) return selfResult;
  }

  for (const user of users) {
    if (user.userId !== currentUserId) {
      const result = await ensureParticipant(supabase, conversationId, user.userId);
      if (result.error) return result;
    }
  }

  return {};
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

export async function getOrCreateDirectConversation(otherUserId: string) {
  const permError = await requireWriteAccess();
  if (permError) return permError;

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
  if (!orgUsers.some((user) => user.userId === otherUserId)) {
    return { error: "User is not in your organization." };
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

export async function getOrCreateRelatedConversation(
  type: Exclude<ConversationType, "direct">,
  relatedId: string
) {
  const permError = await requireWriteAccess();
  if (permError) return permError;

  const featureError = await requireFeatureAccess("messaging", "Messaging");
  if (featureError) return featureError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { error: "Not authenticated." };

  const table = type === "opportunity" ? "opportunities" : "contracts";
  const titleField = type === "opportunity" ? "title" : "contract_name";

  const { data: related } = await supabase
    .from(table)
    .select(`id, ${titleField}`)
    .eq("id", relatedId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!related) {
    return { error: `${type === "opportunity" ? "Opportunity" : "Contract"} not found.` };
  }

  const existingId = await findConversationByRelated(type, relatedId);
  if (existingId) {
    const participantResult = await ensureParticipant(
      supabase,
      existingId,
      currentUserId
    );
    if (participantResult.error) return { error: participantResult.error };
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

  const participantsResult = await addOrgParticipants(supabase, created.id);
  if (participantsResult.error) return { error: participantsResult.error };

  const title = (related as Record<string, string>)[titleField];

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

  const permError = await requireWriteAccess();
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
  const permError = await requireWriteAccess();
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
