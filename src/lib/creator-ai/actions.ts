"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { loadPortalCoachPageData } from "@/lib/portal/coach-page-data";
import { incrementUsageMetric } from "@/lib/subscription/usage";
import {
  buildCreatorAiContext,
  serializeCreatorAiContextForPrompt,
} from "./context";
import { runCreatorAiChat } from "./chat";
import { deriveConversationTitle } from "./demo";
import {
  createCreatorAiConversation,
  getCreatorAiConversation,
  getCreatorAiMessages,
  insertCreatorAiMessage,
  listCreatorAiConversations,
  updateCreatorAiConversationTitle,
} from "./queries";
import { requireCreatorAiCoachAccess } from "./permissions";
import type { CreatorAiConversation, CreatorAiMessage } from "./types";

const MAX_MESSAGE_LENGTH = 4000;

function currentPeriodMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export async function listCreatorAiConversationsAction(): Promise<
  | { success: true; conversations: CreatorAiConversation[] }
  | { error: string; upgradeRequired?: boolean }
> {
  const access = await requireCreatorAiCoachAccess();
  if ("error" in access) return access;

  const conversations = await listCreatorAiConversations(
    access.userId,
    access.creatorId
  );

  return { success: true, conversations };
}

export async function getCreatorAiConversationAction(conversationId: string): Promise<
  | {
      success: true;
      conversation: CreatorAiConversation;
      messages: CreatorAiMessage[];
    }
  | { error: string; upgradeRequired?: boolean }
> {
  const access = await requireCreatorAiCoachAccess();
  if ("error" in access) return access;

  const conversation = await getCreatorAiConversation(
    conversationId,
    access.userId
  );
  if (!conversation) {
    return { error: "Conversation not found." };
  }

  const messages = await getCreatorAiMessages(conversationId, access.userId);
  return { success: true, conversation, messages };
}

export async function sendCreatorAiMessageAction(input: {
  conversationId?: string | null;
  message: string;
}): Promise<
  | {
      success: true;
      conversationId: string;
      userMessage: CreatorAiMessage;
      assistantMessage: CreatorAiMessage;
      mode: "live" | "demo";
      fallbackNotice?: string;
    }
  | { error: string; upgradeRequired?: boolean }
> {
  const access = await requireCreatorAiCoachAccess();
  if ("error" in access) return access;

  const trimmed = input.message.trim();
  if (!trimmed) {
    return { error: "Message cannot be empty." };
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return {
      error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`,
    };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  let conversationId = input.conversationId ?? null;
  let isNewConversation = false;

  if (conversationId) {
    const existing = await getCreatorAiConversation(
      conversationId,
      access.userId
    );
    if (!existing) {
      return { error: "Conversation not found." };
    }
  } else {
    const created = await createCreatorAiConversation({
      userId: access.userId,
      creatorId: access.creatorId,
      title: deriveConversationTitle(trimmed),
    });
    if (!created) {
      return { error: "Could not start a new conversation." };
    }
    conversationId = created.id;
    isNewConversation = true;
  }

  const userMessage = await insertCreatorAiMessage({
    conversationId: conversationId!,
    role: "user",
    content: trimmed,
  });
  if (!userMessage) {
    return { error: "Could not save your message." };
  }

  if (isNewConversation) {
    await updateCreatorAiConversationTitle(
      conversationId!,
      access.userId,
      deriveConversationTitle(trimmed)
    );
  }

  const pageData = await loadPortalCoachPageData(access.creatorId);
  if (!pageData) {
    return { error: "Could not load creator context." };
  }

  const aiContext = buildCreatorAiContext({
    coachContext: pageData.coachContext,
    coachProfile: pageData.coachProfile,
    analytics: pageData.audienceAnalytics,
    contentSnapshots: pageData.contentSnapshots,
    recommendations: pageData.coachSnapshot?.recommendations ?? [],
  });
  const contextJson = serializeCreatorAiContextForPrompt(aiContext);

  const priorMessages = await getCreatorAiMessages(
    conversationId!,
    access.userId
  );
  const history = priorMessages.filter((msg) => msg.id !== userMessage.id);

  const chatResult = await runCreatorAiChat({
    context: aiContext,
    contextJson,
    userMessage: trimmed,
    history,
  });

  const assistantMessage = await insertCreatorAiMessage({
    conversationId: conversationId!,
    role: "assistant",
    content: chatResult.content,
    metadata: {
      mode: chatResult.mode,
      model: chatResult.model,
      tokensUsed: chatResult.tokensUsed,
    },
  });

  if (!assistantMessage) {
    return { error: "Could not save the assistant response." };
  }

  await supabase.from("ai_usage_tracking").insert({
    organization_id: access.organizationId,
    assistant_type: "growth",
    action: "creator_ai_chat",
    tokens_used: chatResult.tokensUsed,
    period_month: currentPeriodMonth(),
    metadata: {
      mode: chatResult.mode,
      model: chatResult.model,
      conversation_id: conversationId,
      creator_id: access.creatorId,
    },
  });

  await incrementUsageMetric("ai_requests");

  revalidatePath("/portal/coach");
  revalidatePath("/billing");

  return {
    success: true,
    conversationId: conversationId!,
    userMessage,
    assistantMessage,
    mode: chatResult.mode,
    fallbackNotice: chatResult.fallbackNotice,
  };
}
