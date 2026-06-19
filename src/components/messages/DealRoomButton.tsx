"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import type { ConversationType } from "@/lib/messages";
import { getOrCreateRelatedConversation } from "@/app/messages/actions";

interface DealRoomButtonProps {
  type: Exclude<ConversationType, "direct">;
  relatedId: string;
  label?: string;
}

export function DealRoomButton({
  type,
  relatedId,
  label = "Open Deal Room",
}: DealRoomButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await getOrCreateRelatedConversation(type, relatedId);

    if ("error" in result) {
      alert(result.error);
      setLoading(false);
      return;
    }

    router.push(`/messages/${result.id}`);
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-gray-300 hover:border-accent/30 hover:text-accent-light disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MessageSquare className="h-4 w-4" />
      )}
      {label}
    </button>
  );
}
