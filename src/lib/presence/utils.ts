import {
  PRESENCE_STALE_MS,
  type PresenceStatus,
  type UserPresenceRow,
} from "./types";

export function resolveEffectivePresence(
  row: Pick<UserPresenceRow, "status" | "last_seen_at"> | null | undefined
): PresenceStatus {
  if (!row) return "inactive";

  if (row.status === "inactive") return "inactive";

  const lastSeen = new Date(row.last_seen_at).getTime();
  const stale = Date.now() - lastSeen > PRESENCE_STALE_MS;

  if (stale) return "inactive";

  return row.status;
}

export function isManualPresenceStatus(status: PresenceStatus): boolean {
  return status === "away" || status === "in_meeting";
}
