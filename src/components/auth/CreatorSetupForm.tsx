"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gamepad2, Loader2 } from "lucide-react";
import { platforms, type Platform } from "@/lib/creators";
import { createClient } from "@/lib/supabase/client";
import { setupCreatorPlayerWorkspace } from "@/lib/organization/creator-setup";
import { beginOnboarding } from "@/app/onboarding/actions";
import { markOnboardingStartedClient } from "@/lib/onboarding/client";
import { AuthInput } from "./AuthInput";

export function CreatorSetupForm() {
  const router = useRouter();
  const [creatorName, setCreatorName] = useState("");
  const [primaryPlatform, setPrimaryPlatform] = useState<Platform>("YouTube");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      setError(
        "Supabase is not configured. Add your credentials to .env.local and restart the server."
      );
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be signed in to complete setup.");
      setLoading(false);
      router.push("/login");
      return;
    }

    const result = await setupCreatorPlayerWorkspace(supabase, {
      userId: user.id,
      userEmail: user.email,
      creatorName,
      primaryPlatform,
    });

    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      return;
    }

    const beginResult = await beginOnboarding();
    if ("error" in beginResult && beginResult.error) {
      setError(beginResult.error);
      setLoading(false);
      return;
    }

    markOnboardingStartedClient();
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <Gamepad2 className="h-5 w-5 text-accent-light" />
          <p className="text-sm text-gray-300">
            Set up your creator profile to access growth tools, the open
            marketplace, and sponsorship opportunities.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      <AuthInput
        label="Creator / player name"
        type="text"
        placeholder="Your display name or gamertag"
        value={creatorName}
        onChange={(event) => setCreatorName(event.target.value)}
        required
      />

      <div>
        <label
          htmlFor="creator-platform"
          className="mb-1.5 block text-sm font-medium text-gray-300"
        >
          Primary platform
        </label>
        <select
          id="creator-platform"
          value={primaryPlatform}
          onChange={(event) =>
            setPrimaryPlatform(event.target.value as Platform)
          }
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
        >
          {platforms.map((platform) => (
            <option key={platform} value={platform}>
              {platform}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading || !creatorName.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-medium text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent-dark disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Setting up your creator portal...
          </>
        ) : (
          "Enter creator portal"
        )}
      </button>
    </form>
  );
}
