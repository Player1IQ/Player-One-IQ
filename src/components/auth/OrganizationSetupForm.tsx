"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Gamepad2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  agencyOrganizationTypes,
  creatorPlayerOrgType,
  type SignupAccountType,
} from "@/lib/organization";
import { platforms, type Platform } from "@/lib/creators";
import { setupCreatorPlayerWorkspace } from "@/lib/organization/creator-setup";
import { beginOnboarding } from "@/app/onboarding/actions";
import { markOnboardingStartedClient } from "@/lib/onboarding/client";
import { AuthInput } from "./AuthInput";

const agencyAndCreatorTypes = [creatorPlayerOrgType, ...agencyOrganizationTypes];

export function OrganizationSetupForm({
  accountType = "agency",
}: {
  accountType?: SignupAccountType;
}) {
  const router = useRouter();
  const isSponsor = accountType === "sponsor";
  const typeOptions = isSponsor
    ? (["Brand / Sponsor"] as const)
    : agencyAndCreatorTypes;
  const defaultType =
    accountType === "creator" || !isSponsor
      ? creatorPlayerOrgType
      : typeOptions[0];
  const [name, setName] = useState("");
  const [type, setType] = useState<string>(defaultType);
  const [primaryPlatform, setPrimaryPlatform] = useState<Platform>("YouTube");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isCreatorPlayer = !isSponsor && type === creatorPlayerOrgType;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isCreatorPlayer) {
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
        creatorName: name,
        primaryPlatform,
      });

      if ("error" in result) {
        setError(result.error);
        setLoading(false);
        return;
      }

      await supabase.auth.refreshSession();
      const beginResult = await beginOnboarding();
      if ("error" in beginResult && beginResult.error) {
        setError(beginResult.error);
        setLoading(false);
        return;
      }

      markOnboardingStartedClient();
      router.push("/onboarding");
      router.refresh();
      return;
    }

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
      setError("You must be signed in to set up your organization.");
      setLoading(false);
      router.push("/login");
      return;
    }

    const { error: insertError } = await supabase.from("organizations").insert({
      user_id: user.id,
      name: name.trim(),
      type,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        router.push("/");
        router.refresh();
        return;
      }
      setError(insertError.message);
      setLoading(false);
      return;
    }

    await supabase.auth.updateUser({
      data: {
        organization_name: name.trim(),
        organization_type: type,
        onboarding_pending: true,
        onboarding_version: 1,
      },
    });

    await supabase.auth.refreshSession();
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
          {isCreatorPlayer ? (
            <Gamepad2 className="h-5 w-5 text-accent-light" />
          ) : (
            <Building2 className="h-5 w-5 text-accent-light" />
          )}
          <p className="text-sm text-gray-300">
            {isSponsor
              ? "Tell us about your brand to personalize your sponsor workspace."
              : isCreatorPlayer
                ? "Set up your creator profile to access growth tools, the open marketplace, and sponsorship opportunities."
                : "Tell us about your organization to personalize your workspace."}
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      <AuthInput
        label={
          isSponsor
            ? "Company name"
            : isCreatorPlayer
              ? "Creator / player name"
              : "Organization name"
        }
        type="text"
        placeholder={
          isSponsor
            ? "Acme Energy Drinks"
            : isCreatorPlayer
              ? "Your display name or gamertag"
              : "Acme Gaming Agency"
        }
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      {!isSponsor ? (
        <div>
          <label
            htmlFor="org-type"
            className="mb-1.5 block text-sm font-medium text-gray-300"
          >
            {isCreatorPlayer ? "Account type" : "Organization type"}
          </label>
          <select
            id="org-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
          >
            {typeOptions.map((orgType) => (
              <option key={orgType} value={orgType}>
                {orgType}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {isCreatorPlayer ? (
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
            onChange={(e) =>
              setPrimaryPlatform(e.target.value as Platform)
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
      ) : null}

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-medium text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent-dark disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {isCreatorPlayer ? "Setting up your creator portal..." : "Setting up..."}
          </>
        ) : isCreatorPlayer ? (
          "Enter creator portal"
        ) : (
          "Complete setup"
        )}
      </button>
    </form>
  );
}
