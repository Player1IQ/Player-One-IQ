import type { DailyMission } from "./types";

const STORAGE_PREFIX = "p1iq:creator-coach";

function storageKey(parts: string[]): string {
  return `${STORAGE_PREFIX}:${parts.join(":")}`;
}

export function getLocalMissionState(
  scope: string,
  scopeId: string | null,
  missionId: string
): DailyMission | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(
      storageKey([scope, scopeId ?? "org", missionId])
    );
    if (!raw) return null;
    return JSON.parse(raw) as DailyMission;
  } catch {
    return null;
  }
}

export function setLocalMissionState(
  scope: string,
  scopeId: string | null,
  mission: DailyMission
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      storageKey([scope, scopeId ?? "org", mission.id]),
      JSON.stringify(mission)
    );
  } catch {
    // Ignore quota errors.
  }
}

export function getLocalDismissedRecommendations(
  scope: string,
  scopeId: string | null
): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(
      storageKey([scope, scopeId ?? "org", "dismissed"])
    );
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function addLocalDismissedRecommendation(
  scope: string,
  scopeId: string | null,
  recommendationId: string
): void {
  if (typeof window === "undefined") return;
  const current = new Set(getLocalDismissedRecommendations(scope, scopeId));
  current.add(recommendationId);
  window.localStorage.setItem(
    storageKey([scope, scopeId ?? "org", "dismissed"]),
    JSON.stringify([...current])
  );
}

export function getLocalCompletedRecommendations(
  scope: string,
  scopeId: string | null
): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(
      storageKey([scope, scopeId ?? "org", "completed"])
    );
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function addLocalCompletedRecommendation(
  scope: string,
  scopeId: string | null,
  recommendationId: string
): void {
  if (typeof window === "undefined") return;
  const current = new Set(getLocalCompletedRecommendations(scope, scopeId));
  current.add(recommendationId);
  window.localStorage.setItem(
    storageKey([scope, scopeId ?? "org", "completed"]),
    JSON.stringify([...current])
  );
}
