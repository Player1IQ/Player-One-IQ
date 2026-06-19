"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import type { OrgUser } from "@/lib/messages";
import {
  createGroupConversation,
  getOrCreateDirectConversation,
} from "@/app/messages/actions";

type StartMode = "direct" | "group";

interface StartConversationModalProps {
  open: boolean;
  onClose: () => void;
  users: OrgUser[];
  currentUserId: string;
}

export function StartConversationModal({
  open,
  onClose,
  users,
  currentUserId,
}: StartConversationModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<StartMode>("direct");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [groupTitle, setGroupTitle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const recipients = users.filter((user) => user.userId !== currentUserId);

  if (!open) return null;

  function toggleMember(userId: string) {
    setSelectedMemberIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result =
      mode === "direct"
        ? await getOrCreateDirectConversation(selectedUserId)
        : await createGroupConversation(groupTitle, selectedMemberIds);

    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      return;
    }

    onClose();
    router.push(`/messages/${result.id}`);
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-surface-raised shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-white">New Conversation</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex rounded-xl border border-white/[0.08] p-1">
            {(["direct", "group"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  mode === option
                    ? "bg-accent/20 text-accent-light"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {option === "direct" ? "Direct message" : "Group chat"}
              </button>
            ))}
          </div>

          {recipients.length === 0 ? (
            <div className="space-y-2 text-sm text-gray-400">
              <p>No other team members available yet.</p>
              <p>
                Invite colleagues from the{" "}
                <Link href="/team" className="text-accent-light hover:underline">
                  Team page
                </Link>{" "}
                and have them accept the invitation before starting a conversation.
              </p>
            </div>
          ) : mode === "direct" ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Team member
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200"
              >
                <option value="">Select a team member</option>
                {recipients.map((user) => (
                  <option key={user.userId} value={user.userId}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Group name
                </label>
                <input
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  required
                  placeholder="e.g. Campaign planning"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Members
                </label>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-white/[0.06] p-2">
                  {recipients.map((user) => (
                    <label
                      key={user.userId}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/[0.04]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMemberIds.includes(user.userId)}
                        onChange={() => toggleMember(user.userId)}
                        className="rounded border-border bg-surface text-accent focus:ring-accent/30"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-200">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500">{user.role}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  You will be added automatically. Select at least one member or
                  create a solo group for notes.
                </p>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-400">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || recipients.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "direct" ? "Start Conversation" : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
