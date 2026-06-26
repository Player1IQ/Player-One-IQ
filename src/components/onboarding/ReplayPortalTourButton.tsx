"use client";

import { Loader2, Map } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { startPortalTour } from "@/app/onboarding/actions";

export function ReplayPortalTourButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleStart() {
    setError("");
    setLoading(true);

    const result = await startPortalTour();
    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if ("redirectTo" in result) {
      router.push(result.redirectTo ?? "/portal?tour=1");
    } else {
      router.push("/portal?tour=1");
    }
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4">
      <p className="text-sm font-medium text-white">Portal walkthrough</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-500">
        Re-open the in-app guided tour that highlights each area of your portal.
      </p>
      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
      <button
        type="button"
        onClick={() => void handleStart()}
        disabled={loading}
        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm text-gray-200 transition-colors hover:border-accent/30 hover:text-white disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Map className="h-4 w-4" />
        )}
        Start portal tour
      </button>
    </div>
  );
}
