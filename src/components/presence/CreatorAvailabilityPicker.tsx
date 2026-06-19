"use client";

import { useState, useTransition } from "react";
import { updateCreatorAvailability } from "@/lib/presence/actions";
import {
  presenceLabels,
  presenceStatuses,
  type PresenceStatus,
} from "@/lib/presence/types";
import { PresenceBadge } from "./PresenceBadge";

interface CreatorAvailabilityPickerProps {
  creatorId: string;
  initialStatus: PresenceStatus;
  canEdit: boolean;
}

export function CreatorAvailabilityPicker({
  creatorId,
  initialStatus,
  canEdit,
}: CreatorAvailabilityPickerProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();

  if (!canEdit) {
    return <PresenceBadge status={status} size="md" />;
  }

  function handleChange(next: PresenceStatus) {
    startTransition(async () => {
      const result = await updateCreatorAvailability(creatorId, next);
      if ("success" in result && result.success) {
        setStatus(next);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <PresenceBadge status={status} size="md" pulse={false} />
      <select
        value={status}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value as PresenceStatus)}
        className="rounded-lg border border-white/[0.08] bg-surface px-2.5 py-1.5 text-xs text-gray-200 outline-none focus:border-accent/40 disabled:opacity-50"
        aria-label="Creator availability"
      >
        {presenceStatuses.map((option) => (
          <option key={option} value={option}>
            {presenceLabels[option]}
          </option>
        ))}
      </select>
    </div>
  );
}
