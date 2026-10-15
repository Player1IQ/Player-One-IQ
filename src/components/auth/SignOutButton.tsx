"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { setPresenceInactive } from "@/lib/presence/actions";
import { hardNavigate } from "@/lib/navigation/hard-navigate";

const PRESENCE_TIMEOUT_MS = 2000;

function withTimeout(task: Promise<unknown>, ms: number): Promise<void> {
  return Promise.race([
    task.then(() => undefined).catch(() => undefined),
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    }),
  ]);
}

export function SignOutButton({
  className,
  label = "Sign out",
}: {
  className?: string;
  label?: string;
}) {
  async function handleSignOut() {
    const supabase = createClient();
    if (!supabase) return;

    const presenceTask = withTimeout(
      setPresenceInactive(),
      PRESENCE_TIMEOUT_MS
    );
    await supabase.auth.signOut();
    hardNavigate("/login");
    void presenceTask;
  }

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      className={
        className ??
        "flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
      }
    >
      <LogOut className="h-4 w-4" />
      {label}
    </button>
  );
}
