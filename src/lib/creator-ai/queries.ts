import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import {
  creatorAiRetentionCutoff,
  mapConversationRow,
  mapMessageRow,
  type CreatorAiConversation,
  type CreatorAiConversationRow,
  type CreatorAiMessage,
  type CreatorAiMessageRole,
  type CreatorAiMessageRow,
} from "./types";

function retentionIso(): string {
  return creatorAiRetentionCutoff().toISOString();
}

export async function listCreatorAiConversations(
  userId: string,
  creatorId: string
): Promise<CreatorAiConversation[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from("creator_ai_conversations")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("creator_id", creatorId)
    .gte("updated_at", retentionIso())
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return (data as CreatorAiConversationRow[]).map(mapConversationRow);
}

export async function getCreatorAiConversation(
  conversationId: string,
  userId: string
): Promise<CreatorAiConversation | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const organizationId = await getOrganizationId();
  if (!organizationId) return null;

  const { data, error } = await supabase
    .from("creator_ai_conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .gte("updated_at", retentionIso())
    .maybeSingle();

  if (error || !data) return null;
  return mapConversationRow(data as CreatorAiConversationRow);
}

export async function getCreatorAiMessages(
  conversationId: string,
  userId: string
): Promise<CreatorAiMessage[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const conversation = await getCreatorAiConversation(conversationId, userId);
  if (!conversation) return [];

  const { data, error } = await supabase
    .from("creator_ai_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("organization_id", organizationId)
    .gte("created_at", retentionIso())
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return (data as CreatorAiMessageRow[]).map(mapMessageRow);
}

export async function createCreatorAiConversation(input: {
  userId: string;
  creatorId: string;
  title?: string;
}): Promise<CreatorAiConversation | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const organizationId = await getOrganizationId();
  if (!organizationId) return null;

  const { data, error } = await supabase
    .from("creator_ai_conversations")
    .insert({
      organization_id: organizationId,
      creator_id: input.creatorId,
      user_id: input.userId,
      title: input.title?.trim() || "New conversation",
    })
    .select("*")
    .single();

  if (error || !data) return null;
  return mapConversationRow(data as CreatorAiConversationRow);
}

export async function insertCreatorAiMessage(input: {
  conversationId: string;
  role: CreatorAiMessageRole;
  content: string;
  metadata?: Record<string, unknown>;
}): Promise<CreatorAiMessage | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const organizationId = await getOrganizationId();
  if (!organizationId) return null;

  const { data, error } = await supabase
    .from("creator_ai_messages")
    .insert({
      conversation_id: input.conversationId,
      organization_id: organizationId,
      role: input.role,
      content: input.content,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  if (error || !data) return null;

  await supabase
    .from("creator_ai_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", input.conversationId)
    .eq("organization_id", organizationId);

  return mapMessageRow(data as CreatorAiMessageRow);
}

export async function updateCreatorAiConversationTitle(
  conversationId: string,
  userId: string,
  title: string
): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) return false;

  const organizationId = await getOrganizationId();
  if (!organizationId) return false;

  const { error } = await supabase
    .from("creator_ai_conversations")
    .update({
      title: title.trim().slice(0, 120),
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId)
    .eq("user_id", userId)
    .eq("organization_id", organizationId);

  return !error;
}

export async function updateCreatorAiConversationSummary(
  conversationId: string,
  summary: string
): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) return false;

  const organizationId = await getOrganizationId();
  if (!organizationId) return false;

  const { error } = await supabase
    .from("creator_ai_conversations")
    .update({
      summary: summary.trim().slice(0, 500),
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId)
    .eq("organization_id", organizationId);

  return !error;
}
