"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Building2, ChevronDown, Loader2 } from "lucide-react";
import { switchOrganization } from "@/app/organization/actions";
import type { UserOrganization } from "@/lib/organization/queries";

interface OrganizationSwitcherProps {
  organizations: UserOrganization[];
  activeOrganizationId: string;
}

export function OrganizationSwitcher({
  organizations,
  activeOrganizationId,
}: OrganizationSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (organizations.length <= 1) {
    const org = organizations[0];
    if (!org) return null;
    return (
      <div className="border-b border-border px-4 py-3">
        <p className="truncate text-sm font-medium text-white">{org.name}</p>
        <p className="truncate text-xs text-gray-500">{org.type}</p>
      </div>
    );
  }

  function handleChange(organizationId: string) {
    if (organizationId === activeOrganizationId) return;
    startTransition(async () => {
      const result = await switchOrganization(organizationId);
      if ("success" in result) {
        router.refresh();
      }
    });
  }

  const activeOrg =
    organizations.find((org) => org.id === activeOrganizationId) ??
    organizations[0];

  return (
    <div className="border-b border-border px-4 py-3">
      <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
        <Building2 className="h-3.5 w-3.5" />
        Workspace
      </label>
      <div className="relative mt-2">
        <select
          value={activeOrg.id}
          onChange={(event) => handleChange(event.target.value)}
          disabled={isPending}
          className="w-full appearance-none rounded-lg border border-border bg-surface px-3 py-2 pr-8 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30 disabled:opacity-50"
        >
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name} ({org.type})
            </option>
          ))}
        </select>
        {isPending ? (
          <Loader2 className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-500" />
        ) : (
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        )}
      </div>
    </div>
  );
}
