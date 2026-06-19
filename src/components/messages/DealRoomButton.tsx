"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import type { ConversationType } from "@/lib/messages";
import { getOrCreateRelatedConversation } from "@/app/messages/actions";

interface DealRoomButtonProps {
  type: Exclude<ConversationType, "direct" | "group">;
  relatedId: string;
  conversationId?: string | null;
  label?: string;
}

export function DealRoomButton({
  type,
  relatedId,
  conversationId,
  label,
}: DealRoomButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const buttonLabel =
    label ?? (conversationId ? "Go to Deal Room" : "Open Deal Room");

  if (conversationId) {
    return (
      <Link
        href={`/messages/${conversationId}`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-gray-300 hover:border-accent/30 hover:text-accent-light"
      >
        <MessageSquare className="h-4 w-4" />
        {buttonLabel}
      </Link>
    );
  }

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
      {buttonLabel}
    </button>
  );
}
