"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchUnreadMessageCount } from "@/app/messages/actions";
import { useUnreadRealtime } from "@/hooks/useMessageRealtime";

export function UnreadBadge() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchUnreadMessageCount();
      setCount(next);
    } catch {
      // Ignore badge refresh failures (e.g. signed out, network blip).
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useUnreadRealtime(() => {
    void refresh();
  });

  if (count <= 0) return null;

  return (
    <span className="ml-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
