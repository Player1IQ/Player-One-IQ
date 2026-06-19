"use client";

import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { fetchMyPresence } from "@/lib/presence/actions";
import { PresencePicker } from "@/components/presence/PresencePicker";
import type { PresenceStatus } from "@/lib/presence/types";

export function SidebarUser() {
  const [email, setEmail] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [initials, setInitials] = useState("PO");
  const [presenceStatus, setPresenceStatus] =
    useState<PresenceStatus>("inactive");
  const [presenceReady, setPresenceReady] = useState(false);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setEmail("demo@playeroneiq.com");
      setOrgName("Demo Mode");
      setPresenceStatus("online");
      setPresenceReady(true);
      return;
    }

    const supabase = createClient();
    if (!supabase) return;

    async function loadUser(client: NonNullable<ReturnType<typeof createClient>>) {
      const {
        data: { user },
      } = await client.auth.getUser();

      if (user?.email) {
        setEmail(user.email);
        const parts = user.email.split("@")[0].split(/[._-]/);
        setInitials(
          parts
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase() ?? "")
            .join("") || "PO"
        );

        const orgNameMeta = user.user_metadata?.organization_name as
          | string
          | undefined;
        if (orgNameMeta) {
          setOrgName(orgNameMeta);
        } else {
          const { data: org } = await client
            .from("organizations")
            .select("name")
            .eq("user_id", user.id)
            .maybeSingle();
          if (org?.name) setOrgName(org.name);
        }

        const status = await fetchMyPresence();
        setPresenceStatus(status);
        setPresenceReady(true);
      }
    }

    loadUser(supabase);
  }, [configured]);

  return (
    <div className="border-t border-white/[0.06] p-3">
      <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/[0.04]">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-muted text-xs font-bold text-white shadow-glow-active">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-200">
            {orgName ?? "My Organization"}
          </p>
          <p className="truncate text-xs text-gray-500">
            {email ?? (configured ? "Loading..." : "Auth disabled")}
          </p>
          {presenceReady && configured ? (
            <div className="mt-1.5">
              <PresencePicker initialStatus={presenceStatus} />
            </div>
          ) : null}
        </div>
      </div>
      {configured && (
        <div className="mt-2 px-1">
          <SignOutButton />
        </div>
      )}
    </div>
  );
}
