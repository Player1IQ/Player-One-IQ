"use client";

import { useUnreadMessageCount } from "@/hooks/useUnreadMessageCount";

export function UnreadBadge() {
  const { count } = useUnreadMessageCount();

  if (count <= 0) return null;

  return (
    <span className="ml-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
