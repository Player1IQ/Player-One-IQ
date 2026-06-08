import { Check, Minus, X } from "lucide-react";
import {
  permissions,
  roles,
  permissionMatrix,
  type PermissionLevel,
} from "@/lib/team";
import { getRoleColor } from "@/lib/team";

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
  if (level === "limited") {
    return (
      <div className="flex justify-center">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/20">
          <Minus className="h-3.5 w-3.5 text-amber-400" />
        </span>
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
          Define what each role can access across the platform
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10">
              <Check className="h-3 w-3 text-emerald-400" />
            </span>
            Full access
          </span>
          <span className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/10">
              <Minus className="h-3 w-3 text-amber-400" />
            </span>
            Limited access
          </span>
          <span className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-500/10">
              <X className="h-3 w-3 text-gray-500" />
            </span>
            No access
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-overlay/60">
              <th className="sticky left-0 z-10 bg-surface-overlay/95 px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Permission
              </th>
              {roles.map((role) => (
                <th
                  key={role}
                  className="min-w-[120px] px-4 py-3.5 text-center"
                >
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${getRoleColor(role)}`}
                  >
                    {role}
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
                {roles.map((role) => (
                  <td key={role} className="px-4 py-4">
                    <PermissionCell level={permissionMatrix[role][perm.key]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
