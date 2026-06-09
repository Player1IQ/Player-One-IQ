"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

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

    const channel = supabase
      .channel("messages:unread")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          onUpdate();
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
  }, [onUpdate]);
}
