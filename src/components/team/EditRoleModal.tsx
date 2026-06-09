"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import {
  type TeamMember,
  type TeamRole,
  invitableRoles,
  roleLabels,
} from "@/lib/team";
import { updateTeamMemberRole } from "@/app/team/actions";

interface EditRoleModalProps {
  open: boolean;
  onClose: () => void;
  member: TeamMember | null;
  currentUserRole: TeamRole | null;
}

export function EditRoleModal({
  open,
  onClose,
  member,
  currentUserRole,
}: EditRoleModalProps) {
  const router = useRouter();
  const [role, setRole] = useState<TeamRole>("viewer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && member && member.role !== "owner") {
      setRole(member.role);
      setError("");
    }
  }, [open, member]);

  if (!open || !member || member.role === "owner" || member.isInvitation) {
    return null;
  }

  const availableRoles = invitableRoles.filter((r) => {
    if (currentUserRole === "admin" && r === "admin") return false;
    return true;
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await updateTeamMemberRole(member!.id, role);

    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    onClose();
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-surface-raised shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Edit Role</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-surface-overlay hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <p className="text-sm text-gray-400">
            Update role for <span className="text-gray-200">{member.email}</span>
          </p>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as TeamRole)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
            >
              {availableRoles.map((r) => (
                <option key={r} value={r}>
                  {roleLabels[r]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-surface-overlay hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
