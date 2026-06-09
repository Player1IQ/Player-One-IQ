"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2 } from "lucide-react";
import { organizationTypes } from "@/lib/organization";
import { updateOrganizationSettings } from "@/app/settings/actions";

interface OrganizationSettingsFormProps {
  initialName: string;
  initialType: string;
  canEdit: boolean;
}

export function OrganizationSettingsForm({
  initialName,
  initialType,
  canEdit,
}: OrganizationSettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [type, setType] = useState(
    organizationTypes.includes(initialType as (typeof organizationTypes)[number])
      ? initialType
      : organizationTypes[0]
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) return;

    setError("");
    setSuccess("");
    setLoading(true);

    const result = await updateOrganizationSettings({ name, type });

    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess("Organization settings saved.");
    router.refresh();
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {success}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-300">
          Organization Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!canEdit}
          required
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-300">
          Organization Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          disabled={!canEdit}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {organizationTypes.map((orgType) => (
            <option key={orgType} value={orgType}>
              {orgType}
            </option>
          ))}
        </select>
      </div>

      {canEdit ? (
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Building2 className="h-4 w-4" />
              Save changes
            </>
          )}
        </button>
      ) : (
        <p className="text-sm text-gray-500">
          You have read-only access to organization settings.
        </p>
      )}
    </form>
  );
}
