"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  ChevronDown,
  Loader2,
  MessageSquarePlus,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getCreatorAiConversationAction,
  listCreatorAiConversationsAction,
  sendCreatorAiMessageAction,
} from "@/lib/creator-ai/actions";
import { CREATOR_AI_SUGGESTED_PROMPTS } from "@/lib/creator-ai/prompts";
import type { CreatorAiConversation, CreatorAiMessage } from "@/lib/creator-ai/types";

interface CreatorAiChatProps {
  initialConversations: CreatorAiConversation[];
  initialConversationId?: string | null;
  enabled: boolean;
}

export function CreatorAiChat({
  initialConversations,
  initialConversationId = null,
  enabled,
}: CreatorAiChatProps) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialConversationId
  );
  const [messages, setMessages] = useState<CreatorAiMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"live" | "demo" | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);

  const loadConversation = useCallback(async (conversationId: string) => {
    setLoadingConversation(true);
    setError("");
    const result = await getCreatorAiConversationAction(conversationId);
    setLoadingConversation(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    setMessages(result.messages);
    const lastAssistant = [...result.messages]
      .reverse()
      .find((msg) => msg.role === "assistant");
    if (lastAssistant?.metadata?.mode === "live" || lastAssistant?.metadata?.mode === "demo") {
      setMode(lastAssistant.metadata.mode as "live" | "demo");
    }
  }, []);

  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  useEffect(() => {
    if (activeConversationId) {
      void loadConversation(activeConversationId);
    } else {
      setMessages([]);
      setMode(null);
    }
  }, [activeConversationId, loadConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  function handleNewConversation() {
    setActiveConversationId(null);
    setMessages([]);
    setInput("");
    setError("");
    setMode(null);
    setFallbackNotice(null);
    setPickerOpen(false);
  }

  function handleSend(messageOverride?: string) {
    const trimmed = (messageOverride ?? input).trim();
    if (!trimmed || isPending || !enabled) return;

    setError("");
    setFallbackNotice(null);
    setInput("");

    const optimisticUser: CreatorAiMessage = {
      id: `optimistic-${Date.now()}`,
      conversationId: activeConversationId ?? "pending",
      organizationId: "",
      role: "user",
      content: trimmed,
      metadata: {},
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, optimisticUser]);

    startTransition(async () => {
      const result = await sendCreatorAiMessageAction({
        conversationId: activeConversationId,
        message: trimmed,
      });

      if ("error" in result) {
        setError(result.error);
        setMessages((current) =>
          current.filter((msg) => msg.id !== optimisticUser.id)
        );
        setInput(trimmed);
        return;
      }

      setActiveConversationId(result.conversationId);
      setMode(result.mode);
      setFallbackNotice(result.fallbackNotice ?? null);
      setMessages((current) => {
        const withoutOptimistic = current.filter(
          (msg) => msg.id !== optimisticUser.id
        );
        return [
          ...withoutOptimistic,
          result.userMessage,
          result.assistantMessage,
        ];
      });

      const listResult = await listCreatorAiConversationsAction();
      if ("success" in listResult) {
        setConversations(listResult.conversations);
      }

      router.refresh();
    });
  }

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId
  );

  return (
    <div className="flex h-full min-h-[32rem] flex-col rounded-2xl border border-white/[0.06] bg-surface-raised/80 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/20">
              <Bot className="h-4 w-4 text-accent-light" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-white">
                AI Creator Coach
              </h2>
              <p className="text-xs text-gray-500">
                {mode === "live"
                  ? "Live AI"
                  : mode === "demo"
                    ? "Demo mode"
                    : "Ask anything about your creator business"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {conversations.length > 0 ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setPickerOpen((open) => !open)}
                className="inline-flex max-w-[10rem] items-center gap-1.5 truncate rounded-lg border border-white/[0.08] bg-black/20 px-2.5 py-1.5 text-xs text-gray-300 hover:border-accent/30 hover:text-white sm:max-w-[12rem]"
              >
                <span className="truncate">
                  {activeConversation?.title ?? "Past chats"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0" />
              </button>
              {pickerOpen ? (
                <div className="absolute right-0 z-20 mt-1 max-h-56 w-56 overflow-y-auto rounded-xl border border-white/[0.08] bg-surface-raised py-1 shadow-xl">
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => {
                        setActiveConversationId(conversation.id);
                        setPickerOpen(false);
                      }}
                      className={cn(
                        "block w-full truncate px-3 py-2 text-left text-xs hover:bg-white/[0.04]",
                        conversation.id === activeConversationId
                          ? "text-accent-light"
                          : "text-gray-300"
                      )}
                    >
                      {conversation.title}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleNewConversation}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-black/20 px-2.5 py-1.5 text-xs text-gray-300 hover:border-accent/30 hover:text-white"
            title="New conversation"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>
      </div>

      {mode === "demo" ? (
        <div className="mx-4 mt-3 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-100/90 sm:mx-5">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
          <p>
            Demo mode — responses are generic. Configure live AI in settings for
            personalized coaching from your workspace data.
          </p>
        </div>
      ) : null}

      {fallbackNotice ? (
        <div className="mx-4 mt-3 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-xs text-gray-400 sm:mx-5">
          {fallbackNotice}
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        {loadingConversation ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-accent-light" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col justify-center">
            <p className="text-center text-sm text-gray-400">
              Ask your Creator Coach about content, consistency, sponsorships, or
              your active recommendations.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {CREATOR_AI_SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={!enabled || isPending}
                  onClick={() => handleSend(prompt)}
                  className="rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-gray-300 transition-colors hover:border-accent/30 hover:text-white disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="space-y-4">
            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <li
                  key={message.id}
                  className={cn("flex gap-3", isUser && "flex-row-reverse")}
                >
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                      isUser
                        ? "bg-white/[0.06] text-gray-300"
                        : "bg-accent/10 text-accent-light"
                    )}
                  >
                    {isUser ? (
                      <User className="h-3.5 w-3.5" />
                    ) : (
                      <Bot className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      isUser
                        ? "bg-accent/15 text-white"
                        : "border border-white/[0.06] bg-black/20 text-gray-200"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </li>
              );
            })}
            {isPending ? (
              <li className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent-light">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-2.5 text-sm text-gray-400">
                  Thinking…
                </div>
              </li>
            ) : null}
            <div ref={bottomRef} />
          </ul>
        )}
      </div>

      {error ? (
        <p className="px-4 pb-2 text-xs text-red-400 sm:px-5">{error}</p>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSend();
        }}
        className="border-t border-white/[0.06] p-4 sm:p-5"
      >
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            rows={2}
            disabled={!enabled || isPending}
            placeholder={
              enabled
                ? "Ask your Creator Coach…"
                : "Upgrade to unlock AI Coach chat"
            }
            className="min-h-[2.75rem] flex-1 resize-none rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-accent/40 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!enabled || isPending || !input.trim()}
            className="inline-flex h-[2.75rem] w-[2.75rem] shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent-dark disabled:opacity-50"
            aria-label="Send message"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
