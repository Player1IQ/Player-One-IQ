"use client";

import { useEffect } from "react";
import { heartbeatPresence } from "@/lib/presence/actions";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { notifySessionExpired } from "@/components/auth/SessionExpiryGate";

const HEARTBEAT_MS = 60 * 1000;

export function PresenceHeartbeat() {
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let cancelled = false;

    async function beat() {
      if (cancelled) return;
      try {
        const result = await heartbeatPresence();
        if (result && "error" in result && result.error === "Not signed in.") {
          notifySessionExpired();
          return;
        }
      } catch {
        // Old tab after a deploy: the server action id no longer exists.
        window.location.reload();
      }
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
