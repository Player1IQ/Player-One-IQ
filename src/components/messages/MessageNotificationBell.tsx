"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Loader2, MessageSquare } from "lucide-react";
import {
  fetchUnreadConversationPreviews,
  type UnreadConversationPreview,
} from "@/app/messages/actions";
import { useUnreadMessageCount } from "@/hooks/useUnreadMessageCount";
import { cn } from "@/lib/utils";

interface MessageNotificationBellProps {
  messagingEnabled?: boolean;
  className?: string;
}

export function MessageNotificationBell({
  messagingEnabled = true,
  className,
}: MessageNotificationBellProps) {
  const { count } = useUnreadMessageCount();
  const [open, setOpen] = useState(false);
  const [previews, setPreviews] = useState<UnreadConversationPreview[]>([]);
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadPreviews = useCallback(async () => {
    setLoadingPreviews(true);
    try {
      const items = await fetchUnreadConversationPreviews();
      setPreviews(items);
    } catch {
      setPreviews([]);
    } finally {
      setLoadingPreviews(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void loadPreviews();
    }
  }, [open, count, loadPreviews]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!messagingEnabled) return null;

  const badgeLabel = count > 99 ? "99+" : String(count);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-surface-raised/60 text-gray-400 transition-colors hover:border-accent/30 hover:text-accent-light"
        aria-label={count > 0 ? `${count} unread messages` : "Messages"}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-surface">
            {badgeLabel}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-white/[0.06] bg-surface-raised/95 shadow-2xl backdrop-blur-xl">
          <div className="border-b border-white/[0.06] px-4 py-3">
            <p className="text-sm font-semibold text-white">Messages</p>
            <p className="mt-0.5 text-xs text-gray-500">
              {count > 0
                ? `${count} unread message${count === 1 ? "" : "s"}`
                : "You're all caught up"}
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loadingPreviews ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : previews.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04] text-gray-500">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <p className="text-sm text-gray-400">No unread messages</p>
              </div>
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {previews.map((conversation) => (
                  <li key={conversation.id}>
                    <Link
                      href={`/messages/${conversation.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-xs font-semibold text-accent-light">
                        {conversation.title.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-white">
                            {conversation.title}
                          </p>
                          <span className="shrink-0 text-[10px] text-gray-500">
                            {conversation.updatedAtDisplay}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {conversation.subtitle}
                        </p>
                        <p className="mt-1 truncate text-xs text-gray-400">
                          {conversation.lastMessage ?? "No messages yet"}
                        </p>
                      </div>
                      <span className="mt-0.5 inline-flex min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {conversation.unreadCount > 99
                          ? "99+"
                          : conversation.unreadCount}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-white/[0.06] px-4 py-3">
            <Link
              href="/messages"
              onClick={() => setOpen(false)}
              className="block text-center text-sm font-medium text-accent-light transition-colors hover:text-white"
            >
              View all messages
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
