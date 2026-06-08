"use client";

import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { SignOutButton } from "@/components/auth/SignOutButton";

export function SidebarUser() {
  const [email, setEmail] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [initials, setInitials] = useState("PO");
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setEmail("demo@playeroneiq.com");
      setOrgName("Demo Mode");
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
      }
    }

    loadUser(supabase);
  }, [configured]);

  return (
    <div className="border-t border-border p-4">
      <div className="flex items-center gap-3 rounded-lg bg-surface-overlay px-3 py-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-muted text-xs font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-200">
            {orgName ?? "My Organization"}
          </p>
          <p className="truncate text-xs text-gray-500">
            {email ?? (configured ? "Loading..." : "Auth disabled")}
          </p>
        </div>
      </div>
      {configured && (
        <div className="mt-2">
          <SignOutButton />
        </div>
      )}
    </div>
  );
}
