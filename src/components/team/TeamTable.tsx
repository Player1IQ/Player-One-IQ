"use client";

import Link from "next/link";
import { MoreHorizontal, Eye, Pencil, UserX } from "lucide-react";
import { useState } from "react";
import type { TeamMember } from "@/lib/team";
import { TeamMemberAvatar } from "./TeamMemberAvatar";
import { RoleBadge } from "./RoleBadge";
import { MemberStatusBadge } from "./MemberStatusBadge";

interface TeamTableProps {
  members: TeamMember[];
}

export function TeamTable({ members }: TeamTableProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  if (members.length === 0) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-border bg-surface-raised">
        <p className="text-sm text-gray-500">No team members match your search.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface-raised shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-overlay/60">
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Name
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Role
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Department
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Last Login
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {members.map((member) => (
              <tr
                key={member.id}
                className="group transition-colors hover:bg-accent/[0.03]"
              >
                <td className="px-6 py-4">
                  <Link
                    href={`/team/${member.id}`}
                    className="flex items-center gap-3"
                  >
                    <TeamMemberAvatar
                      initials={member.avatarInitials}
                      color={member.avatarColor}
                      size="sm"
                    />
                    <div>
                      <p className="font-semibold text-gray-100 transition-colors group-hover:text-accent-light">
                        {member.name}
                      </p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <RoleBadge role={member.role} />
                </td>
                <td className="px-6 py-4 text-gray-300">{member.department}</td>
                <td className="px-6 py-4">
                  <MemberStatusBadge status={member.status} />
                </td>
                <td className="px-6 py-4 text-gray-400">{member.lastLogin}</td>
                <td className="relative px-6 py-4">
                  <button
                    onClick={() =>
                      setOpenMenu(openMenu === member.id ? null : member.id)
                    }
                    className="rounded-lg p-1.5 text-gray-400 opacity-0 transition-all hover:bg-surface-overlay hover:text-gray-200 group-hover:opacity-100"
                    aria-label="Actions"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                  {openMenu === member.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenu(null)}
                      />
                      <div className="absolute right-6 top-12 z-20 w-44 rounded-lg border border-border bg-surface-overlay py-1 shadow-xl ring-1 ring-white/5">
                        <Link
                          href={`/team/${member.id}`}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-accent/10 hover:text-accent-light"
                          onClick={() => setOpenMenu(null)}
                        >
                          <Eye className="h-4 w-4" />
                          View Profile
                        </Link>
                        <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-accent/10 hover:text-accent-light">
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>
                        <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10">
                          <UserX className="h-4 w-4" />
                          Deactivate
                        </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
