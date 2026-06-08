"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { organizationTypes } from "@/lib/organization";
import { AuthInput } from "./AuthInput";

export function OrganizationSetupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState(organizationTypes[0]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      data: { organization_name: name.trim(), organization_type: type },
    });

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-accent-light" />
          <p className="text-sm text-gray-300">
            Tell us about your organization to personalize your workspace.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <AuthInput
        label="Organization Name"
        type="text"
        placeholder="Acme Gaming Agency"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <div>
        <label
          htmlFor="org-type"
          className="mb-1.5 block text-sm font-medium text-gray-300"
        >
          Organization Type
        </label>
        <select
          id="org-type"
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
        >
          {organizationTypes.map((orgType) => (
            <option key={orgType} value={orgType}>
              {orgType}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-medium text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent-dark disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Setting up...
          </>
        ) : (
          "Complete setup"
        )}
      </button>
    </form>
  );
}
