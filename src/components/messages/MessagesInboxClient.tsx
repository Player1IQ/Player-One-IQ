"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MessageSquarePlus, MessageSquare, Mail, Users, Search } from "lucide-react";
import type { Conversation, ConversationType, OrgUser } from "@/lib/messages";
import { conversationTypeLabels } from "@/lib/messages";
import { ConversationTypeBadge } from "./ConversationTypeBadge";
import { StartConversationModal } from "./StartConversationModal";
import { MetricCard } from "@/components/ui/MetricCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

const selectClassName =
  "rounded-xl border border-white/[0.08] bg-surface-raised/80 px-3 py-2.5 text-sm text-gray-200 backdrop-blur-sm focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30";

type InboxFilter = "all" | "unread" | ConversationType;

const quickFilters: Array<{ value: InboxFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "direct", label: conversationTypeLabels.direct },
  { value: "opportunity", label: "Opportunity" },
  { value: "contract", label: conversationTypeLabels.contract },
];

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
  const [typeFilter, setTypeFilter] = useState<InboxFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);

  const totalUnread = conversations.reduce(
    (sum, conversation) => sum + conversation.unreadCount,
    0
  );

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return conversations.filter((conversation) => {
      const matchesSearch =
        conversation.title.toLowerCase().includes(query) ||
        conversation.subtitle.toLowerCase().includes(query) ||
        (conversation.lastMessage?.toLowerCase().includes(query) ?? false);
      const matchesType =
        typeFilter === "all"
          ? true
          : typeFilter === "unread"
            ? conversation.unreadCount > 0
            : conversation.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [conversations, search, typeFilter]);

  const hasActiveFilters = search.trim().length > 0 || typeFilter !== "all";

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          title="Conversations"
          value={String(conversations.length)}
          icon={MessageSquare}
          iconColor="text-accent-light"
        />
        <MetricCard
          title="Unread"
          value={String(totalUnread)}
          subtitle={totalUnread > 0 ? "Needs attention" : "All caught up"}
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

      {totalUnread > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/25 bg-accent/10 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-accent-light">
              {totalUnread} unread message{totalUnread === 1 ? "" : "s"}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              Deal rooms and direct messages waiting for your reply.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTypeFilter("unread")}
            className="shrink-0 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent-light transition-colors hover:bg-accent/20"
          >
            View unread
          </button>
        </div>
      ) : conversations.length > 0 ? (
        <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-100">
          All caught up — no unread messages.
        </p>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Input
          type="search"
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="h-4 w-4" />}
          className="max-w-md flex-1"
        />
        <div className="flex flex-wrap gap-3">
          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as InboxFilter)
            }
            className={selectClassName}
          >
            <option value="all">All types</option>
            <option value="unread">Unread</option>
            <option value="direct">{conversationTypeLabels.direct}</option>
            <option value="opportunity">{conversationTypeLabels.opportunity}</option>
            <option value="contract">{conversationTypeLabels.contract}</option>
          </select>
          <Button type="button" onClick={() => setModalOpen(true)}>
            <MessageSquarePlus className="h-4 w-4" />
            New Message
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setTypeFilter(filter.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              typeFilter === filter.value
                ? "border-accent/40 bg-accent/15 text-accent-light"
                : "border-white/[0.08] text-gray-500 hover:border-white/[0.12] hover:text-gray-300"
            )}
          >
            {filter.label}
            {filter.value === "unread" && totalUnread > 0 ? (
              <span className="ml-1.5 text-accent-light">({totalUnread})</span>
            ) : null}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={
            conversations.length === 0
              ? "No conversations yet"
              : "No matching conversations"
          }
          description={
            conversations.length === 0
              ? "Start a direct message or open a deal room from an opportunity or contract."
              : "Try a different search or filter."
          }
          action={
            conversations.length === 0 ? (
              <Button type="button" size="sm" onClick={() => setModalOpen(true)}>
                New Message
              </Button>
            ) : hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setTypeFilter("all");
                }}
                className="text-sm text-accent-light hover:text-white"
              >
                Clear filters
              </button>
            ) : undefined
          }
          className="min-h-[320px]"
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filtered.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/messages/${conversation.id}`}
                className="block rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-4 transition-colors hover:border-accent/30"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-sm font-semibold text-accent-light">
                    {conversation.title.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={cn(
                          "truncate text-sm",
                          conversation.unreadCount > 0
                            ? "font-semibold text-white"
                            : "font-medium text-gray-200"
                        )}
                      >
                        {conversation.title}
                      </p>
                      <ConversationTypeBadge type={conversation.type} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {conversation.subtitle}
                    </p>
                    <p
                      className={cn(
                        "mt-2 line-clamp-2 text-sm",
                        conversation.unreadCount > 0 ? "text-gray-300" : "text-gray-500"
                      )}
                    >
                      {conversation.lastMessage ?? "No messages yet"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-gray-500">
                      {conversation.updatedAtDisplay}
                    </p>
                    {conversation.unreadCount > 0 ? (
                      <span className="mt-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {conversation.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-2xl border border-white/[0.06] bg-surface-raised/80 backdrop-blur-sm md:block">
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
                          className={cn(
                            "truncate text-sm",
                            conversation.unreadCount > 0
                              ? "font-semibold text-white"
                              : "font-medium text-gray-200"
                          )}
                        >
                          {conversation.title}
                        </p>
                        <ConversationTypeBadge type={conversation.type} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-gray-500">
                        {conversation.subtitle}
                      </p>
                      <p
                        className={cn(
                          "mt-2 truncate text-sm",
                          conversation.unreadCount > 0 ? "text-gray-300" : "text-gray-500"
                        )}
                      >
                        {conversation.lastMessage ?? "No messages yet"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-gray-500">
                        {conversation.updatedAtDisplay}
                      </p>
                      {conversation.unreadCount > 0 ? (
                        <span className="mt-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {conversation.unreadCount}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <StartConversationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        users={users}
        currentUserId={currentUserId}
      />
    </div>
  );
}
