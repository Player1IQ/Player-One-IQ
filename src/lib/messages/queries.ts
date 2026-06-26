import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import { canAccessConversation } from "@/lib/permissions";
import {
  type Conversation,
  type ConversationRow,
  type ConversationType,
  type ConversationParticipant,
  type Message,
  type MessageRow,
  type OrgUser,
  type ParticipantRow,
  displayNameForUser,
  formatInboxTime,
  mapMessageRow,
  truncatePreview,
} from "./types";
import { displayNameFromEmail } from "@/lib/team";

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export async function getOrganizationUsers(): Promise<OrgUser[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const [{ data, error }, { data: org }] = await Promise.all([
    supabase
      .from("team_members")
      .select("user_id, email, role")
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .not("user_id", "is", null),
    supabase
      .from("organizations")
      .select("user_id")
      .eq("id", organizationId)
      .maybeSingle(),
  ]);

  const byId = new Map<string, OrgUser>();

  if (!error && data) {
    for (const row of data) {
      if (!row.user_id) continue;
      byId.set(row.user_id, {
        userId: row.user_id,
        email: row.email,
        name: displayNameFromEmail(row.email),
        role: row.role,
      });
    }
  }

  const ownerId = org?.user_id;
  if (ownerId && !byId.has(ownerId)) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id === ownerId && user?.email) {
      byId.set(ownerId, {
        userId: ownerId,
        email: user.email,
        name: displayNameFromEmail(user.email),
        role: "owner",
      });
    }
  }

  return [...byId.values()];
}

export async function getOrganizationUserIds(): Promise<string[]> {
  const users = await getOrganizationUsers();
  const ids = new Set(users.map((user) => user.userId));

  const supabase = await createClient();
  const organizationId = await getOrganizationId();
  if (supabase && organizationId) {
    const { data: org } = await supabase
      .from("organizations")
      .select("user_id")
      .eq("id", organizationId)
      .maybeSingle();
    if (org?.user_id) ids.add(org.user_id);
  }

  return [...ids];
}

async function buildUsersById(): Promise<Map<string, OrgUser>> {
  const users = await getOrganizationUsers();
  return new Map(users.map((user) => [user.userId, user]));
}

async function getRelatedTitles(
  conversations: ConversationRow[]
): Promise<Map<string, string>> {
  const supabase = await createClient();
  if (!supabase) return new Map();

  const organizationId = await getOrganizationId();
  if (!organizationId) return new Map();

  const opportunityIds = conversations
    .filter((c) => c.type === "opportunity" && c.related_id)
    .map((c) => c.related_id as string);
  const contractIds = conversations
    .filter((c) => c.type === "contract" && c.related_id)
    .map((c) => c.related_id as string);

  const titles = new Map<string, string>();

  if (opportunityIds.length > 0) {
    const { data } = await supabase
      .from("opportunities")
      .select("id, title")
      .eq("organization_id", organizationId)
      .in("id", opportunityIds);

    for (const row of data ?? []) {
      titles.set(row.id, row.title);
    }
  }

  if (contractIds.length > 0) {
    const { data } = await supabase
      .from("contracts")
      .select("id, contract_name")
      .eq("organization_id", organizationId)
      .in("id", contractIds);

    for (const row of data ?? []) {
      titles.set(row.id, row.contract_name);
    }
  }

  return titles;
}

function buildConversationTitle(
  row: ConversationRow,
  currentUserId: string,
  participantUserIds: string[],
  usersById: Map<string, OrgUser>,
  relatedTitles: Map<string, string>
): { title: string; subtitle: string } {
  if (row.type === "opportunity" && row.related_id) {
    return {
      title: relatedTitles.get(row.related_id) ?? "Opportunity Deal Room",
      subtitle: "Opportunity conversation",
    };
  }

  if (row.type === "contract" && row.related_id) {
    return {
      title: relatedTitles.get(row.related_id) ?? "Contract Deal Room",
      subtitle: "Contract conversation",
    };
  }

  if (row.type === "group") {
    const memberCount = participantUserIds.length;
    return {
      title: row.title?.trim() || "Group Chat",
      subtitle: `${memberCount} member${memberCount === 1 ? "" : "s"}`,
    };
  }

  const otherUserId = participantUserIds.find((id) => id !== currentUserId);
  if (otherUserId) {
    const other = usersById.get(otherUserId);
    return {
      title: other?.name ?? "Direct Message",
      subtitle: other?.email ?? "Team member",
    };
  }

  return { title: "Direct Message", subtitle: "Private conversation" };
}

async function enrichConversations(
  rows: ConversationRow[],
  currentUserId: string
): Promise<Conversation[]> {
  if (rows.length === 0) return [];

  const supabase = await createClient();
  if (!supabase) return [];

  const conversationIds = rows.map((row) => row.id);
  const usersById = await buildUsersById();
  const relatedTitles = await getRelatedTitles(rows);

  const { data: participants } = await supabase
    .from("conversation_participants")
    .select("*")
    .in("conversation_id", conversationIds);

  const participantsByConversation = new Map<string, ParticipantRow[]>();
  for (const participant of (participants ?? []) as ParticipantRow[]) {
    const list = participantsByConversation.get(participant.conversation_id) ?? [];
    list.push(participant);
    participantsByConversation.set(participant.conversation_id, list);
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });

  const lastMessageByConversation = new Map<string, MessageRow>();
  const unreadByConversation = new Map<string, number>();

  for (const message of (messages ?? []) as MessageRow[]) {
    if (!lastMessageByConversation.has(message.conversation_id)) {
      lastMessageByConversation.set(message.conversation_id, message);
    }

    const participantList =
      participantsByConversation.get(message.conversation_id) ?? [];
    const selfParticipant = participantList.find(
      (p) => p.user_id === currentUserId
    );
    const lastReadAt = selfParticipant?.last_read_at ?? new Date(0).toISOString();

    if (
      message.sender_id !== currentUserId &&
      new Date(message.created_at) > new Date(lastReadAt)
    ) {
      unreadByConversation.set(
        message.conversation_id,
        (unreadByConversation.get(message.conversation_id) ?? 0) + 1
      );
    }
  }

  return rows.map((row) => {
    const participantList = participantsByConversation.get(row.id) ?? [];
    const participantUserIds = participantList.map((p) => p.user_id);
    const { title, subtitle } = buildConversationTitle(
      row,
      currentUserId,
      participantUserIds,
      usersById,
      relatedTitles
    );
    const lastMessage = lastMessageByConversation.get(row.id);

    return {
      id: row.id,
      organizationId: row.organization_id,
      type: row.type,
      relatedId: row.related_id,
      title,
      subtitle,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      updatedAtDisplay: formatInboxTime(row.updated_at),
      lastMessage: lastMessage ? truncatePreview(lastMessage.content) : null,
      lastMessageAt: lastMessage?.created_at ?? null,
      lastMessageAtDisplay: lastMessage
        ? formatInboxTime(lastMessage.created_at)
        : "—",
      unreadCount: unreadByConversation.get(row.id) ?? 0,
      participantUserIds,
    };
  });
}

export async function getConversations(): Promise<Conversation[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return [];

  await supabase.rpc("repair_direct_conversations_for_user");

  const { data: participantRows } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", currentUserId);

  const conversationIds = (participantRows ?? []).map((row) => row.conversation_id);
  if (conversationIds.length === 0) return [];

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .in("id", conversationIds)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];

  return enrichConversations(data as ConversationRow[], currentUserId);
}

export async function getConversationById(
  id: string
): Promise<Conversation | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return null;

  await supabase.rpc("repair_direct_conversation_participants", {
    p_conversation_id: id,
  });

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  if (!(await canAccessConversation(id))) return null;

  const enriched = await enrichConversations([data as ConversationRow], currentUserId);
  return enriched[0] ?? null;
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return [];

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  const usersById = await buildUsersById();

  return (data as MessageRow[]).map((row) =>
    mapMessageRow(
      row,
      displayNameForUser(row.sender_id, usersById),
      currentUserId
    )
  );
}

export async function getUnreadMessageCount(): Promise<number> {
  const conversations = await getConversations();
  return conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0);
}

export async function getRecentMessageActivity(limit = 5) {
  const supabase = await createClient();
  if (!supabase) return [];

  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("entity_type", "message")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data;
}

export async function findConversationByRelated(
  type: Exclude<ConversationType, "direct" | "group">,
  relatedId: string
): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const organizationId = await getOrganizationId();
  if (!organizationId) return null;

  const { data } = await supabase
    .from("conversations")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("type", type)
    .eq("related_id", relatedId)
    .maybeSingle();

  return data?.id ?? null;
}

export async function getConversationParticipants(
  conversationId: string
): Promise<ConversationParticipant[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return [];

  const { data: participants, error } = await supabase
    .from("conversation_participants")
    .select("user_id, role")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error || !participants) return [];

  const usersById = await buildUsersById();

  return participants.map((row) => {
    const user = usersById.get(row.user_id);
    return {
      userId: row.user_id,
      name: user?.name ?? "Team member",
      email: user?.email ?? "",
      role: user?.role ?? "member",
      participantRole: (row.role as "admin" | "member") ?? "member",
      isCurrentUser: row.user_id === currentUserId,
    };
  });
}
