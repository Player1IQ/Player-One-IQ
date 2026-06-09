"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MessageSquarePlus, Search } from "lucide-react";
import type { Conversation, OrgUser } from "@/lib/messages";
import { ConversationTypeBadge } from "./ConversationTypeBadge";
import { StartConversationModal } from "./StartConversationModal";

interface MessagesInboxClientProps {
  conversations: Conversation[];
  users: OrgUser[];
  currentUserId: string;
}

export function MessagesInboxClient({
  conversations,
  users,
  currentUserId,
}: MessagesInboxClientProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | Conversation["type"]>("all");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return conversations.filter((conversation) => {
      const matchesSearch =
        conversation.title.toLowerCase().includes(query) ||
        conversation.subtitle.toLowerCase().includes(query) ||
        (conversation.lastMessage?.toLowerCase().includes(query) ?? false);
      const matchesType =
        typeFilter === "all" || conversation.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [conversations, search, typeFilter]);

  const totalUnread = conversations.reduce(
    (sum, conversation) => sum + conversation.unreadCount,
    0
  );

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-gray-400">Conversations</p>
          <p className="mt-2 text-3xl font-bold text-white">{conversations.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-gray-400">Unread</p>
          <p className="mt-2 text-3xl font-bold text-white">{totalUnread}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-gray-400">Team Members</p>
          <p className="mt-2 text-3xl font-bold text-white">{users.length}</p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-raised py-2.5 pl-10 pr-4 text-sm text-gray-200"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as "all" | Conversation["type"])
            }
            className="rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-sm text-gray-200"
          >
            <option value="all">All types</option>
            <option value="direct">Direct</option>
            <option value="opportunity">Opportunity</option>
            <option value="contract">Contract</option>
          </select>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New Message
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-raised">
          <p className="text-sm font-medium text-gray-300">No conversations yet</p>
          <p className="mt-1 text-xs text-gray-500">
            Start a direct message or open a deal room from an opportunity or contract.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface-raised">
          <ul className="divide-y divide-border-subtle">
            {filtered.map((conversation) => (
              <li key={conversation.id}>
                <Link
                  href={`/messages/${conversation.id}`}
                  className="flex items-start gap-4 px-6 py-4 transition-colors hover:bg-accent/[0.03]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent-light">
                    {conversation.title.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={`truncate text-sm ${
                          conversation.unreadCount > 0
                            ? "font-semibold text-white"
                            : "font-medium text-gray-200"
                        }`}
                      >
                        {conversation.title}
                      </p>
                      <ConversationTypeBadge type={conversation.type} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {conversation.subtitle}
                    </p>
                    <p
                      className={`mt-2 truncate text-sm ${
                        conversation.unreadCount > 0 ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      {conversation.lastMessage ?? "No messages yet"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-gray-500">
                      {conversation.updatedAtDisplay}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className="mt-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <StartConversationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        users={users}
        currentUserId={currentUserId}
      />
    </>
  );
}
