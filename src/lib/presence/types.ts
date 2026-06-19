export type PresenceStatus = "online" | "away" | "in_meeting" | "inactive";

export const presenceStatuses: PresenceStatus[] = [
  "online",
  "away",
  "in_meeting",
  "inactive",
];

export const presenceLabels: Record<PresenceStatus, string> = {
  online: "Online",
  away: "Away",
  in_meeting: "In meeting",
  inactive: "Inactive",
};

export const presenceDotColors: Record<PresenceStatus, string> = {
  online: "bg-emerald-400",
  away: "bg-amber-400",
  in_meeting: "bg-violet-400",
  inactive: "bg-gray-500",
};

export const presenceTextColors: Record<PresenceStatus, string> = {
  online: "text-emerald-400",
  away: "text-amber-400",
  in_meeting: "text-violet-400",
  inactive: "text-gray-500",
};

export interface UserPresenceRow {
  user_id: string;
  status: PresenceStatus;
  is_manual: boolean;
  last_seen_at: string;
  updated_at: string;
}

/** Presence is stale if no heartbeat within this window. */
export const PRESENCE_STALE_MS = 3 * 60 * 1000;
