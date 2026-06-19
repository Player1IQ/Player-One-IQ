"use client";

import { useEffect } from "react";
import { heartbeatPresence } from "@/lib/presence/actions";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const HEARTBEAT_MS = 60 * 1000;

export function PresenceHeartbeat() {
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let cancelled = false;

    async function beat() {
      if (cancelled) return;
      await heartbeatPresence();
    }

    void beat();
    const id = window.setInterval(() => void beat(), HEARTBEAT_MS);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return null;
}
