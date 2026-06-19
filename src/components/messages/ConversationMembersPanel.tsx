"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, UserMinus, UserPlus, Users } from "lucide-react";
import type {
  Conversation,
  ConversationParticipant,
  OrgUser,
} from "@/lib/messages";
import {
  addConversationParticipants,
  removeConversationParticipant,
  syncConversationParticipants,
} from "@/app/messages/actions";
import { AddMembersModal } from "./AddMembersModal";

interface ConversationMembersPanelProps {
  conversation: Conversation;
  participants: ConversationParticipant[];
  orgUsers: OrgUser[];
  onMembersChanged: () => void;
}

export function ConversationMembersPanel({
  conversation,
  participants,
  orgUsers,
  onMembersChanged,
}: ConversationMembersPanelProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const canManageMembers = conversation.type !== "direct";
  const isDealRoom =
    conversation.type === "opportunity" || conversation.type === "contract";

  const participantIds = useMemo(
    () => new Set(participants.map((participant) => participant.userId)),
    [participants]
  );

  const availableUsers = orgUsers.filter(
    (user) => !participantIds.has(user.userId)
  );

  function handleRemove(userId: string, name: string) {
    const label =
      userId === participants.find((p) => p.isCurrentUser)?.userId
        ? "leave this conversation"
        : `remove ${name}`;

    if (!confirm(`Are you sure you want to ${label}?`)) return;

    setError("");
    startTransition(async () => {
      const result = await removeConversationParticipant(
        conversation.id,
        userId
      );
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      if ("left" in result && result.left) {
        window.location.href = "/messages";
        return;
      }
      onMembersChanged();
    });
  }

  function handleSyncTeam() {
    setError("");
    startTransition(async () => {
      const result = await syncConversationParticipants(conversation.id);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      onMembersChanged();
    });
  }

  return (
    <>
      <div className="rounded-xl border border-white/[0.06] bg-surface/60 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-accent-light" />
              <h3 className="text-sm font-semibold text-white">Members</h3>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {participants.length} participant
              {participants.length === 1 ? "" : "s"}
            </p>
          </div>
          {canManageMembers ? (
            <div className="flex flex-wrap gap-2">
              {isDealRoom ? (
                <button
                  type="button"
                  onClick={handleSyncTeam}
                  disabled={isPending}
                  className="rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-xs text-gray-300 transition-colors hover:bg-white/[0.04] disabled:opacity-50"
                >
                  Sync team
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                disabled={isPending || availableUsers.length === 0}
                className="inline-flex items-center gap-1 rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1.5 text-xs font-medium text-accent-light transition-colors hover:bg-accent/20 disabled:opacity-50"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
          ) : null}
        </div>

        {error ? (
          <p className="mt-3 text-xs text-red-400">{error}</p>
        ) : null}

        <ul className="mt-4 space-y-2">
          {participants.map((participant) => (
            <li
              key={participant.userId}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-200">
                  {participant.name}
                  {participant.isCurrentUser ? (
                    <span className="ml-1 text-xs text-gray-500">(you)</span>
                  ) : null}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {participant.email || participant.role}
                  {participant.participantRole === "admin" ? " · Admin" : ""}
                </p>
              </div>
              {canManageMembers &&
              (participant.isCurrentUser || conversation.type !== "direct") ? (
                <button
                  type="button"
                  onClick={() =>
                    handleRemove(participant.userId, participant.name)
                  }
                  disabled={isPending}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                  title={
                    participant.isCurrentUser ? "Leave conversation" : "Remove member"
                  }
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UserMinus className="h-3.5 w-3.5" />
                  )}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <AddMembersModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        users={availableUsers}
        onSubmit={async (userIds) => {
          const result = await addConversationParticipants(
            conversation.id,
            userIds
          );
          if ("error" in result && result.error) {
            return { error: result.error };
          }
          onMembersChanged();
          return { success: true };
        }}
      />
    </>
  );
}
