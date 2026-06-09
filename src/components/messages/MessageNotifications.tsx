"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchMessageNotificationDetails } from "@/app/messages/actions";

interface MessageNotification {
  id: string;
  conversationId: string;
  title: string;
  senderName: string;
  preview: string;
}

const AUTO_DISMISS_MS = 8000;

export function MessageNotifications() {
  const pathname = usePathname();
  const router = useRouter();
  const [notification, setNotification] = useState<MessageNotification | null>(
    null
  );
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  const dismiss = useCallback(() => {
    setNotification(null);
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  }, []);

  const showNotification = useCallback(
    (next: MessageNotification) => {
      setNotification(next);
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      dismissTimer.current = setTimeout(dismiss, AUTO_DISMISS_MS);
      router.refresh();
    },
    [dismiss, router]
  );

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    void supabase.auth.getUser().then(({ data }) => {
      currentUserIdRef.current = data.user?.id ?? null;
    });

    const channel = supabase
      .channel("messages:notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const message = payload.new as {
            id: string;
            conversation_id: string;
            sender_id: string;
          };

          if (!message?.id || !message.conversation_id) return;
          if (message.sender_id === currentUserIdRef.current) return;

          const activeConversationId = pathname.match(
            /^\/messages\/([^/]+)/
          )?.[1];
          if (activeConversationId === message.conversation_id) return;

          const details = await fetchMessageNotificationDetails(
            message.conversation_id,
            message.id
          );

          if ("error" in details) return;

          showNotification({
            id: message.id,
            conversationId: message.conversation_id,
            title: details.title,
            senderName: details.senderName,
            preview: details.preview,
          });
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          return;
        }
      });

    return () => {
      void supabase.removeChannel(channel);
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [pathname, showNotification]);

  if (!notification) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 w-full max-w-sm"
    >
      <div className="overflow-hidden rounded-xl border border-border bg-surface-raised shadow-2xl ring-1 ring-accent/20">
        <div className="flex items-start gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent-light">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">
              New message from {notification.senderName}
            </p>
            <p className="mt-0.5 truncate text-xs text-gray-400">
              {notification.title}
            </p>
            <p className="mt-2 line-clamp-2 text-sm text-gray-300">
              {notification.preview}
            </p>
            <Link
              href={`/messages/${notification.conversationId}`}
              onClick={dismiss}
              className="mt-3 inline-block text-sm font-medium text-accent-light hover:text-white"
            >
              Open conversation
            </Link>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-lg p-1 text-gray-500 hover:bg-surface hover:text-gray-300"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
