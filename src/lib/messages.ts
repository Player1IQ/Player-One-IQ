import { displayNameFromEmail } from "@/lib/team";

export type ConversationType = "direct" | "opportunity" | "contract";

export const conversationTypes: ConversationType[] = [
  "direct",
  "opportunity",
  "contract",
];

export const conversationTypeLabels: Record<ConversationType, string> = {
  direct: "Direct Message",
  opportunity: "Opportunity",
  contract: "Contract",
};

export interface ConversationRow {
  id: string;
  organization_id: string;
  type: ConversationType;
  related_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParticipantRow {
  id: string;
  conversation_id: string;
  user_id: string;
  last_read_at: string;
  created_at: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface OrgUser {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export interface Conversation {
  id: string;
  organizationId: string;
  type: ConversationType;
  relatedId: string | null;
  title: string;
  subtitle: string;
  createdAt: string;
  updatedAt: string;
  updatedAtDisplay: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  lastMessageAtDisplay: string;
  unreadCount: number;
  participantUserIds: string[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  createdAtDisplay: string;
  isOwn: boolean;
}

export function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatInboxTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function truncatePreview(content: string, max = 80): string {
  const trimmed = content.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

export function mapMessageRow(
  row: MessageRow,
  senderName: string,
  currentUserId: string
): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderName,
    content: row.content,
    createdAt: row.created_at,
    createdAtDisplay: formatMessageTime(row.created_at),
    isOwn: row.sender_id === currentUserId,
  };
}

export function displayNameForUser(
  userId: string,
  usersById: Map<string, OrgUser>
): string {
  const user = usersById.get(userId);
  if (!user) return "Unknown User";
  return user.name || displayNameFromEmail(user.email);
}
