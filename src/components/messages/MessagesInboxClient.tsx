"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MessageSquarePlus, MessageSquare, Mail, Users } from "lucide-react";
import type { Conversation, OrgUser } from "@/lib/messages";
import { ConversationTypeBadge } from "./ConversationTypeBadge";
import { StartConversationModal } from "./StartConversationModal";
import { MetricCard } from "@/components/ui/MetricCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

const selectClassName =
  "rounded-xl border border-white/[0.08] bg-surface-raised/80 px-3 py-2.5 text-sm text-gray-200 backdrop-blur-sm focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30";

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
        <MetricCard
          title="Conversations"
          value={String(conversations.length)}
          icon={MessageSquare}
          iconColor="text-accent-light"
        />
        <MetricCard
          title="Unread"
          value={String(totalUnread)}
          icon={Mail}
          iconColor="text-emerald-400"
        />
        <MetricCard
          title="Team Members"
          value={String(users.length)}
          icon={Users}
          iconColor="text-violet-400"
        />
      </div>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Input
          type="search"
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md flex-1"
        />
        <div className="flex flex-wrap gap-3">
          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as "all" | Conversation["type"])
            }
            className={selectClassName}
          >
            <option value="all">All types</option>
            <option value="direct">Direct</option>
            <option value="opportunity">Opportunity</option>
            <option value="contract">Contract</option>
          </select>
          <Button type="button" onClick={() => setModalOpen(true)}>
            <MessageSquarePlus className="h-4 w-4" />
            New Message
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No conversations yet"
          description="Start a direct message or open a deal room from an opportunity or contract."
          action={
            <Button type="button" size="sm" onClick={() => setModalOpen(true)}>
              New Message
            </Button>
          }
          className="min-h-[320px]"
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-surface-raised/80 backdrop-blur-sm">
          <ul className="divide-y divide-white/[0.06]">
            {filtered.map((conversation) => (
              <li key={conversation.id}>
                <Link
                  href={`/messages/${conversation.id}`}
                  className="flex items-start gap-4 px-6 py-4 transition-colors hover:bg-white/[0.02]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-sm font-semibold text-accent-light">
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
