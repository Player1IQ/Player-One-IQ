"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import type { OrgUser } from "@/lib/messages";
import { getOrCreateDirectConversation } from "@/app/messages/actions";

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
  const [selectedUserId, setSelectedUserId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const recipients = users.filter((user) => user.userId !== currentUserId);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId) return;

    setError("");
    setLoading(true);

    const result = await getOrCreateDirectConversation(selectedUserId);

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
          <h2 className="text-lg font-semibold text-white">New Message</h2>
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

          {recipients.length === 0 ? (
            <div className="space-y-2 text-sm text-gray-400">
              <p>No other team members available yet.</p>
              <p>
                Invite colleagues from the{" "}
                <Link href="/team" className="text-accent-light hover:underline">
                  Team page
                </Link>{" "}
                and have them accept the invitation before starting a direct
                message.
              </p>
            </div>
          ) : (
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
              Start Conversation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
