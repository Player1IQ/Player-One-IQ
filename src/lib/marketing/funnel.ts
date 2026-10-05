import { createServiceClient } from "@/lib/supabase/admin";
import type { OAuthPlatform } from "@/lib/platform-oauth/types";

export const FUNNEL_SESSION_COOKIE = "p1iq_funnel_sid";
export const FUNNEL_SESSION_STORAGE_KEY = "p1iq_funnel_sid";

export const FUNNEL_EVENTS = [
  "visit",
  "signup",
  "connect_started",
  "connect_completed",
  "snapshot_viewed",
  "plan_generated",
  "weekly_return",
] as const;

export type FunnelEventName = (typeof FUNNEL_EVENTS)[number];

export const FUNNEL_PLATFORMS: OAuthPlatform[] = [
  "YouTube",
  "Twitch",
  "Instagram",
  "TikTok",
  "Kick",
];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MAX_EVENTS_PER_SESSION_PER_HOUR = 40;

export function isFunnelEventName(value: string): value is FunnelEventName {
  return (FUNNEL_EVENTS as readonly string[]).includes(value);
}

export function isFunnelSessionId(value: string): boolean {
  return UUID_RE.test(value);
}

export function parseFunnelPlatform(
  value: string | null | undefined
): OAuthPlatform | null {
  if (!value) return null;
  return FUNNEL_PLATFORMS.includes(value as OAuthPlatform)
    ? (value as OAuthPlatform)
    : null;
}

export async function insertFunnelEvent(input: {
  sessionId: string;
  event: FunnelEventName;
  platform?: OAuthPlatform | null;
}): Promise<{ ok: true } | { error: string; status: number }> {
  if (!isFunnelSessionId(input.sessionId)) {
    return { error: "Invalid session id.", status: 400 };
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return { error: "Service client is not configured.", status: 503 };
  }

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("marketing_funnel_events")
    .select("id", { count: "exact", head: true })
    .eq("session_id", input.sessionId)
    .gte("created_at", hourAgo);

  if (countError) {
    return { error: countError.message, status: 500 };
  }

  if ((count ?? 0) >= MAX_EVENTS_PER_SESSION_PER_HOUR) {
    return { error: "Rate limited.", status: 429 };
  }

  const { error } = await supabase.from("marketing_funnel_events").insert({
    session_id: input.sessionId,
    event: input.event,
    platform: input.platform ?? null,
  });

  if (error) {
    return { error: error.message, status: 500 };
  }

  return { ok: true };
}
