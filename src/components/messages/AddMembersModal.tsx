"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import type { OrgUser } from "@/lib/messages";

interface AddMembersModalProps {
  open: boolean;
  onClose: () => void;
  users: OrgUser[];
  onSubmit: (
    userIds: string[]
  ) => Promise<{ error?: string; success?: boolean }>;
}

export function AddMembersModal({
  open,
  onClose,
  users,
  onSubmit,
}: AddMembersModalProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  function toggleUser(userId: string) {
    setSelected((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.length === 0) return;

    setError("");
    setLoading(true);
    const result = await onSubmit(selected);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSelected([]);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-surface-raised shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Add members</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error ? (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          ) : null}

          {users.length === 0 ? (
            <p className="text-sm text-gray-400">
              Everyone on your team is already in this conversation.
            </p>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-white/[0.06] p-2">
              {users.map((user) => (
                <label
                  key={user.userId}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/[0.04]"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(user.userId)}
                    onChange={() => toggleUser(user.userId)}
                    className="rounded border-border bg-surface text-accent focus:ring-accent/30"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-200">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.email} · {user.role}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selected.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Add selected
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
