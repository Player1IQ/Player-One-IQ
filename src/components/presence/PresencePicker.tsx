"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { updateMyPresence } from "@/lib/presence/actions";
import type { PresenceStatus } from "@/lib/presence/types";
import { PresenceBadge } from "./PresenceBadge";

interface PresencePickerProps {
  initialStatus: PresenceStatus;
}

const selectableStatuses: PresenceStatus[] = [
  "online",
  "away",
  "in_meeting",
];

export function PresencePicker({ initialStatus }: PresencePickerProps) {
  const [status, setStatus] = useState(initialStatus);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSelect(next: PresenceStatus) {
    setOpen(false);
    startTransition(async () => {
      const result = await updateMyPresence(next);
      if ("success" in result && result.success) {
        setStatus(next);
      }
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        className="flex w-full items-center justify-between gap-2 rounded-lg px-1 py-0.5 text-left transition-colors hover:bg-white/[0.04] disabled:opacity-60"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {isPending ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            Updating...
          </span>
        ) : (
          <PresenceBadge status={status} size="sm" />
        )}
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-500" />
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close status menu"
            onClick={() => setOpen(false)}
          />
          <ul
            role="listbox"
            className="absolute bottom-full left-0 z-50 mb-1 w-full min-w-[10rem] overflow-hidden rounded-lg border border-white/[0.08] bg-surface-raised py-1 shadow-xl"
          >
            {selectableStatuses.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  role="option"
                  aria-selected={status === option}
                  onClick={() => handleSelect(option)}
                  className="flex w-full items-center px-3 py-2 text-left transition-colors hover:bg-white/[0.05]"
                >
                  <PresenceBadge status={option} size="sm" pulse={false} />
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
