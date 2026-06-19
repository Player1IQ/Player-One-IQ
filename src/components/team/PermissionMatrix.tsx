import { Check, X } from "lucide-react";
import {
  permissions,
  teamRoles,
  permissionMatrix,
  type PermissionLevel,
  roleLabels,
  getRoleColor,
} from "@/lib/team";

function PermissionCell({ level }: { level: PermissionLevel }) {
  if (level === "full") {
    return (
      <div className="flex justify-center">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        </span>
      </div>
    );
  }
  if (level === "read") {
    return (
      <div className="flex justify-center">
        <span className="text-xs font-medium text-sky-400">Read</span>
      </div>
    );
  }
  if (level === "scoped") {
    return (
      <div className="flex justify-center">
        <span className="text-xs font-medium text-amber-400">Own</span>
      </div>
    );
  }
  return (
    <div className="flex justify-center">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-500/10 ring-1 ring-gray-500/20">
        <X className="h-3.5 w-3.5 text-gray-500" />
      </span>
    </div>
  );
}

export function PermissionMatrix() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface-raised shadow-sm">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-base font-semibold text-white">
          Role-Based Permission Matrix
        </h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Staff roles manage the agency; portal roles are scoped to a linked
          roster profile
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-overlay/60">
              <th className="sticky left-0 z-10 bg-surface-overlay/95 px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Permission
              </th>
              {teamRoles.map((role) => (
                <th
                  key={role}
                  className="min-w-[88px] px-3 py-3.5 text-center"
                >
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${getRoleColor(role)}`}
                  >
                    {roleLabels[role]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {permissions.map((perm) => (
              <tr
                key={perm.key}
                className="transition-colors hover:bg-surface-overlay/20"
              >
                <td className="sticky left-0 z-10 bg-surface-raised px-6 py-4">
                  <p className="font-medium text-gray-200">{perm.label}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {perm.description}
                  </p>
                </td>
                {teamRoles.map((role) => (
                  <td key={role} className="px-3 py-4">
                    <PermissionCell level={permissionMatrix[role][perm.key]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border px-6 py-3 text-xs text-gray-500">
        <span className="font-medium text-emerald-400">Full</span> = read and
        write · <span className="font-medium text-sky-400">Read</span> = view
        only · <span className="font-medium text-amber-400">Own</span> = linked
        roster record only
      </div>
    </div>
  );
}
