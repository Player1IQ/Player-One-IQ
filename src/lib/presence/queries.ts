import { createClient } from "@/lib/supabase/server";
import { resolveEffectivePresence } from "./utils";
import type { PresenceStatus, UserPresenceRow } from "./types";

export async function getPresenceForUserIds(
  userIds: string[]
): Promise<Map<string, PresenceStatus>> {
  const map = new Map<string, PresenceStatus>();
  if (userIds.length === 0) return map;

  const supabase = await createClient();
  if (!supabase) return map;

  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  const { data, error } = await supabase
    .from("user_presence")
    .select("user_id, status, last_seen_at")
    .in("user_id", uniqueIds);

  if (error || !data) return map;

  for (const row of data as Pick<UserPresenceRow, "user_id" | "status" | "last_seen_at">[]) {
    map.set(row.user_id, resolveEffectivePresence(row));
  }

  for (const id of uniqueIds) {
    if (!map.has(id)) map.set(id, "inactive");
  }

  return map;
}

export async function getMyPresence(): Promise<PresenceStatus> {
  const supabase = await createClient();
  if (!supabase) return "inactive";

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "inactive";

  const { data } = await supabase
    .from("user_presence")
    .select("status, last_seen_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return resolveEffectivePresence(
    data as Pick<UserPresenceRow, "status" | "last_seen_at"> | null
  );
}
