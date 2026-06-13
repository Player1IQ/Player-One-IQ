"use client";

import { useEffect } from "react";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const unreadListeners = new Set<() => void>();
let unreadChannel: RealtimeChannel | null = null;
let unreadSubscriberCount = 0;

function notifyUnreadListeners() {
  for (const listener of unreadListeners) {
    listener();
  }
}

function ensureUnreadChannel(supabase: SupabaseClient) {
  if (unreadChannel) return;

  unreadChannel = supabase
    .channel("messages:unread")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
      },
      () => {
        notifyUnreadListeners();
      }
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        return;
      }
    });
}

function teardownUnreadChannel(supabase: SupabaseClient) {
  if (!unreadChannel) return;
  void supabase.removeChannel(unreadChannel);
  unreadChannel = null;
}

export function useMessageRealtime(
  conversationId: string | null,
  onMessage: () => void
) {
  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          onMessage();
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          return;
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, onMessage]);
}

export function useUnreadRealtime(onUpdate: () => void) {
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    unreadListeners.add(onUpdate);
    unreadSubscriberCount += 1;

    if (unreadSubscriberCount === 1) {
      ensureUnreadChannel(supabase);
    }

    return () => {
      unreadListeners.delete(onUpdate);
      unreadSubscriberCount -= 1;

      if (unreadSubscriberCount === 0) {
        teardownUnreadChannel(supabase);
      }
    };
  }, [onUpdate]);
}
