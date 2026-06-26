"use client";

import { Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { replayOnboarding } from "@/app/onboarding/actions";
import {
  clearOnboardingStepClient,
  markOnboardingStartedClient,
} from "@/lib/onboarding/client";

interface ReplayOnboardingButtonProps {
  variant?: "card" | "inline";
}

export function ReplayOnboardingButton({
  variant = "card",
}: ReplayOnboardingButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleReplay() {
    setError("");
    setLoading(true);
    clearOnboardingStepClient();
    markOnboardingStartedClient();

    const result = await replayOnboarding();
    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if ("redirectTo" in result) {
      router.push(result.redirectTo ?? "/onboarding?step=welcome");
    } else {
      router.push("/onboarding?step=welcome");
    }
    router.refresh();
  }

  if (variant === "inline") {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => void handleReplay()}
          disabled={loading}
          className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-300 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" />
          )}
          Replay setup guide
        </button>
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4">
      <p className="text-sm font-medium text-white">Setup guide</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-500">
        Walk through welcome, platform connections, and finish setup again
        without creating a new account.
      </p>
      {error ? (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      ) : null}
      <button
        type="button"
        onClick={() => void handleReplay()}
        disabled={loading}
        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm text-gray-200 transition-colors hover:border-accent/30 hover:text-white disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RotateCcw className="h-4 w-4" />
        )}
        Replay setup guide
      </button>
    </div>
  );
}
