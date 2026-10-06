"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const SESSION_EXPIRED_EVENT = "poiq:session-expired";

export function notifySessionExpired() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

export function SessionExpiryGate() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    function markExpired() {
      setExpired(true);
    }

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        markExpired();
      }
    });

    const onExpired = () => markExpired();
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);

    async function check() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) markExpired();
    }

    void check();
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      data.subscription.unsubscribe();
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  if (!expired) return null;

  const nextPath = `${pathname}${searchParams.size ? `?${searchParams.toString()}` : ""}`;
  const loginHref = `/login?redirect=${encodeURIComponent(nextPath)}&expired=1`;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface-raised p-8 text-center">
        <h1 className="text-lg font-semibold text-white">
          Please sign in again
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Your session expired. Sign in to return to this page.
        </p>
        <a
          href={loginHref}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-dark"
        >
          Sign in
        </a>
      </div>
    </div>
  );
}
