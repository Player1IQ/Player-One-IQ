"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import type {
  Conversation,
  ConversationParticipant,
  Message,
  OrgUser,
} from "@/lib/messages";
import { ConversationTypeBadge } from "./ConversationTypeBadge";
import { ConversationMembersPanel } from "./ConversationMembersPanel";
import { markConversationRead, sendMessage } from "@/app/messages/actions";
import { MESSAGES_UNREAD_CHANGED_EVENT } from "@/hooks/useUnreadMessageCount";
import { useMessageRealtime } from "@/hooks/useMessageRealtime";

interface ConversationClientProps {
  conversation: Conversation;
  initialMessages: Message[];
  participants: ConversationParticipant[];
  orgUsers: OrgUser[];
  relatedHref?: string | null;
}

export function ConversationClient({
  conversation,
  initialMessages,
  participants,
  orgUsers,
  relatedHref,
}: ConversationClientProps) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  useMessageRealtime(conversation.id, refresh);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    void markConversationRead(conversation.id).then((result) => {
      if ("success" in result) {
        window.dispatchEvent(new CustomEvent(MESSAGES_UNREAD_CHANGED_EVENT));
      }
    });
  }, [conversation.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setError("");
    setLoading(true);

    const result = await sendMessage(conversation.id, content);

    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setContent("");
    router.refresh();
    setLoading(false);
  }

  const showMembersPanel = conversation.type !== "direct";

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="flex h-[calc(100vh-12rem)] flex-col rounded-xl border border-border bg-surface-raised">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/messages"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-accent-light"
            >
              <ArrowLeft className="h-4 w-4" />
              Inbox
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-white">
                  {conversation.title}
                </h2>
                <ConversationTypeBadge type={conversation.type} />
              </div>
              <p className="text-xs text-gray-500">{conversation.subtitle}</p>
            </div>
          </div>
          {relatedHref && (
            <Link
              href={relatedHref}
              className="text-xs font-medium text-accent-light hover:text-white"
            >
              View {conversation.type}
            </Link>
          )}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-gray-500">
                No messages yet. Send the first message to start the conversation.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    message.isOwn
                      ? "bg-accent text-white"
                      : "border border-border bg-surface text-gray-200"
                  }`}
                >
                  {!message.isOwn && (
                    <p className="mb-1 text-xs font-medium text-accent-light">
                      {message.senderName}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                  <p
                    className={`mt-2 text-[10px] ${
                      message.isOwn ? "text-white/70" : "text-gray-500"
                    }`}
                  >
                    {message.createdAtDisplay}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-border px-6 py-4">
          {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
          <div className="flex gap-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a message..."
              rows={2}
              className="flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200"
            />
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="inline-flex h-fit items-center gap-2 self-end rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send
            </button>
          </div>
        </form>
      </div>

      {showMembersPanel ? (
        <ConversationMembersPanel
          conversation={conversation}
          participants={participants}
          orgUsers={orgUsers}
          onMembersChanged={refresh}
        />
      ) : null}
    </div>
  );
}
