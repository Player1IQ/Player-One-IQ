"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Eye, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { roleLabels, teamRoles, type TeamRole } from "@/lib/team";
import {
  clearRolePreviewAction,
  setRolePreviewAction,
} from "@/lib/dev/role-preview-actions";

interface RolePreviewSwitcherProps {
  currentRole: TeamRole;
  previewActive: boolean;
}

export function RolePreviewSwitcher({
  currentRole,
  previewActive,
}: RolePreviewSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSelect(role: TeamRole) {
    setError("");
    startTransition(async () => {
      const result = await setRolePreviewAction(role);
      if (result && "error" in result) {
        setError(result.error);
      }
    });
  }

  function handleClear() {
    setError("");
    startTransition(async () => {
      const result = await clearRolePreviewAction();
      if (result && "error" in result) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex max-w-sm flex-col items-end gap-2">
      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 shadow-lg">
          {error}
        </div>
      ) : null}

      {open ? (
        <div className="w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#111520] shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Role preview
              </p>
              <p className="text-sm font-medium text-white">
                {roleLabels[currentRole]}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-gray-500 hover:bg-white/5 hover:text-white"
              aria-label="Close role preview menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ul className="max-h-80 overflow-y-auto p-2">
            {teamRoles.map((role) => (
              <li key={role}>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleSelect(role)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    role === currentRole
                      ? "bg-accent/15 text-accent-light"
                      : "text-gray-300 hover:bg-white/[0.04] hover:text-white"
                  )}
                >
                  <span>{roleLabels[role]}</span>
                  {role === currentRole ? (
                    <span className="text-[10px] uppercase tracking-wide text-accent-light">
                      Active
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
          {previewActive ? (
            <div className="border-t border-white/[0.06] p-2">
              <button
                type="button"
                disabled={isPending}
                onClick={handleClear}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-400 hover:bg-white/[0.04] hover:text-white"
              >
                Exit preview (back to real role)
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-lg backdrop-blur-md transition-colors",
          previewActive
            ? "border-amber-500/30 bg-amber-500/15 text-amber-200 hover:bg-amber-500/20"
            : "border-white/10 bg-[#111520]/95 text-gray-200 hover:border-accent/30 hover:text-white"
        )}
      >
        <Eye className="h-4 w-4" />
        {previewActive ? `Preview: ${roleLabels[currentRole]}` : "Switch role"}
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
    </div>
  );
}
