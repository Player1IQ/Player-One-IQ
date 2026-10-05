import {
  FUNNEL_EVENTS,
  FUNNEL_SESSION_COOKIE,
  FUNNEL_SESSION_STORAGE_KEY,
  isFunnelEventName,
  isFunnelSessionId,
  parseFunnelPlatform,
  type FunnelEventName,
} from "./funnel";

export type FoundingAnalyticsEvent =
  | "founding_page_view"
  | "founding_apply_clicked"
  | "founding_application_started"
  | "founding_application_submitted"
  | "founding_creator_application"
  | "founding_organization_application";

export type MarketingAnalyticsEvent = FoundingAnalyticsEvent | FunnelEventName;

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}

function persistFunnelSessionId(sessionId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FUNNEL_SESSION_STORAGE_KEY, sessionId);
  } catch {
    // Ignore private-mode quota errors.
  }
  document.cookie = `${FUNNEL_SESSION_COOKIE}=${sessionId}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function getOrCreateFunnelSessionId(): string | null {
  if (typeof window === "undefined") return null;

  let existing: string | null = null;
  try {
    existing = window.localStorage.getItem(FUNNEL_SESSION_STORAGE_KEY);
  } catch {
    existing = null;
  }

  if (!existing || !isFunnelSessionId(existing)) {
    existing = readCookie(FUNNEL_SESSION_COOKIE);
  }

  if (existing && isFunnelSessionId(existing)) {
    persistFunnelSessionId(existing);
    return existing;
  }

  const sessionId = crypto.randomUUID();
  persistFunnelSessionId(sessionId);
  return sessionId;
}

function persistSnapshotViewed(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("p1iq_last_snapshot_at", String(Date.now()));
  } catch {
    // Ignore.
  }
}

function shouldTrackWeeklyReturn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem("p1iq_last_snapshot_at");
    if (!raw) return false;
    const last = Number(raw);
    if (!Number.isFinite(last)) return false;
    return Date.now() - last >= 6 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function persistFunnelEvent(
  event: FunnelEventName,
  payload?: AnalyticsPayload
): void {
  const sessionId = getOrCreateFunnelSessionId();
  if (!sessionId) return;

  const platform = parseFunnelPlatform(
    typeof payload?.platform === "string" ? payload.platform : null
  );

  void fetch("/api/marketing/funnel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      sessionId,
      event,
      platform,
    }),
  }).catch(() => {
    // Funnel writes are best-effort.
  });
}

/** Lightweight marketing analytics hook — persist funnel events; founding stays local too. */
export function trackMarketingEvent(
  event: MarketingAnalyticsEvent,
  payload?: AnalyticsPayload
): void {
  if (typeof window === "undefined") return;

  const detail = { event, ...payload, ts: Date.now() };
  window.dispatchEvent(new CustomEvent("p1iq:analytics", { detail }));

  if (process.env.NODE_ENV === "development") {
    console.info("[analytics]", detail);
  }

  if (!isFunnelEventName(event)) return;

  if (event === "snapshot_viewed" && shouldTrackWeeklyReturn()) {
    persistFunnelEvent("weekly_return", payload);
  }

  persistFunnelEvent(event, payload);

  if (event === "snapshot_viewed") {
    persistSnapshotViewed();
  }
}
