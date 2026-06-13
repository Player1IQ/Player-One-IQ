"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { fetchUnreadMessageCount } from "@/app/messages/actions";
import { useUnreadRealtime } from "@/hooks/useMessageRealtime";

export const MESSAGES_UNREAD_CHANGED_EVENT = "messages:unread-changed";

export function useUnreadMessageCount() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchUnreadMessageCount();
      setCount(next);
    } catch {
      // Ignore refresh failures (e.g. signed out, network blip).
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, pathname]);

  useUnreadRealtime(() => {
    void refresh();
  });

  useEffect(() => {
    const handler = () => {
      void refresh();
    };
    window.addEventListener(MESSAGES_UNREAD_CHANGED_EVENT, handler);
    return () => {
      window.removeEventListener(MESSAGES_UNREAD_CHANGED_EVENT, handler);
    };
  }, [refresh]);

  return { count, refresh };
}
