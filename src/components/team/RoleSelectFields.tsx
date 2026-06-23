"use client";

import {
  type TeamRole,
  invitableRoles,
  roleDescriptions,
  roleGroups,
  roleLabels,
  requiresLinkedCreator,
  requiresLinkedSponsor,
} from "@/lib/team";
import type { Creator } from "@/lib/creators";
import type { Sponsor } from "@/lib/sponsors";

interface RoleSelectFieldsProps {
  role: TeamRole;
  onRoleChange: (role: TeamRole) => void;
  linkedCreatorId: string;
  onLinkedCreatorChange: (creatorId: string) => void;
  linkedSponsorId: string;
  onLinkedSponsorChange: (sponsorId: string) => void;
  creators: Creator[];
  sponsors: Sponsor[];
  availableRoles?: TeamRole[];
}

export function RoleSelectFields({
  role,
  onRoleChange,
  linkedCreatorId,
  onLinkedCreatorChange,
  linkedSponsorId,
  onLinkedSponsorChange,
  creators,
  sponsors,
  availableRoles,
}: RoleSelectFieldsProps) {
  const allowedRoles = availableRoles ?? invitableRoles;

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-300">
          Role
        </label>
        <select
          value={role}
          onChange={(e) => onRoleChange(e.target.value as TeamRole)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
        >
          {roleGroups.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.roles
                .filter((groupRole) => allowedRoles.includes(groupRole))
                .map((groupRole) => (
                  <option key={groupRole} value={groupRole}>
                    {roleLabels[groupRole]}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        <p className="mt-2 text-xs leading-relaxed text-gray-500">
          {roleDescriptions[role]}
        </p>
      </div>

      {requiresLinkedCreator(role) ? (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            Linked roster profile
          </label>
          <select
            value={linkedCreatorId}
            onChange={(e) => onLinkedCreatorChange(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
          >
            <option value="">Select a creator or player</option>
            {creators.map((creator) => (
              <option key={creator.id} value={creator.id}>
                {creator.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-500">
            Portal users only see data for this roster profile.
          </p>
        </div>
      ) : null}

      {requiresLinkedSponsor(role) ? (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            Linked sponsor company
          </label>
          <select
            value={linkedSponsorId}
            onChange={(e) => onLinkedSponsorChange(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
          >
            <option value="">Select a sponsor</option>
            {sponsors.map((sponsor) => (
              <option key={sponsor.id} value={sponsor.id}>
                {sponsor.companyName}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-500">
            Sponsor contacts only see partnerships for this company.
          </p>
        </div>
      ) : null}
    </div>
  );
}
