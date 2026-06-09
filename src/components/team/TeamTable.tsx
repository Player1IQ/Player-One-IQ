"use client";

import Link from "next/link";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  UserX,
  Copy,
  Ban,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type TeamMember, type TeamRole } from "@/lib/team";
import {
  removeTeamMember,
  revokeInvitation,
} from "@/app/team/actions";
import { TeamMemberAvatar } from "./TeamMemberAvatar";
import { RoleBadge } from "./RoleBadge";
import { MemberStatusBadge } from "./MemberStatusBadge";
import { EditRoleModal } from "./EditRoleModal";

interface TeamTableProps {
  members: TeamMember[];
  canManageTeam: boolean;
  currentUserRole: TeamRole | null;
}

export function TeamTable({
  members,
  canManageTeam,
  currentUserRole,
}: TeamTableProps) {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  async function handleRemove(member: TeamMember) {
    const label = member.isInvitation ? "revoke this invitation" : "remove this member";
    if (!confirm(`Are you sure you want to ${label}?`)) return;

    const result = member.isInvitation
      ? await revokeInvitation(member.id)
      : await removeTeamMember(member.id);

    if ("error" in result && result.error) {
      alert(result.error);
      return;
    }

    setOpenMenu(null);
    router.refresh();
  }

  async function copyInviteLink(token: string) {
    const link = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(link);
    setOpenMenu(null);
  }

  if (members.length === 0) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-raised">
        <p className="text-sm font-medium text-gray-300">No team members yet</p>
        <p className="mt-1 text-xs text-gray-500">
          Invite your first team member to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-surface-raised shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-overlay/60">
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Member
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Role
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Joined
                </th>
                {canManageTeam && (
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {members.map((member) => {
                const canEdit =
                  canManageTeam &&
                  !member.isInvitation &&
                  member.role !== "owner" &&
                  !(currentUserRole === "admin" && member.role === "admin");

                const canRemove =
                  canManageTeam &&
                  member.role !== "owner" &&
                  !(currentUserRole === "admin" && member.role === "admin");

                return (
                  <tr
                    key={member.id}
                    className="group transition-colors hover:bg-accent/[0.03]"
                  >
                    <td className="px-6 py-4">
                      {member.isInvitation ? (
                        <div className="flex items-center gap-3">
                          <TeamMemberAvatar
                            initials={member.avatarInitials}
                            color={member.avatarColor}
                            size="sm"
                          />
                          <div>
                            <p className="font-semibold text-gray-100">
                              {member.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      ) : (
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
                            <p className="text-xs text-gray-500">
                              {member.email}
                            </p>
                          </div>
                        </Link>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={member.role} />
                    </td>
                    <td className="px-6 py-4">
                      <MemberStatusBadge status={member.status} />
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {member.joinedDate}
                    </td>
                    {canManageTeam && (
                      <td className="relative px-6 py-4">
                        {(canEdit || canRemove || member.isInvitation) && (
                          <>
                            <button
                              onClick={() =>
                                setOpenMenu(
                                  openMenu === member.id ? null : member.id
                                )
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
                                <div className="absolute right-6 top-12 z-20 w-48 rounded-lg border border-border bg-surface-overlay py-1 shadow-xl ring-1 ring-white/5">
                                  {!member.isInvitation && (
                                    <Link
                                      href={`/team/${member.id}`}
                                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-accent/10 hover:text-accent-light"
                                      onClick={() => setOpenMenu(null)}
                                    >
                                      <Eye className="h-4 w-4" />
                                      View Profile
                                    </Link>
                                  )}
                                  {canEdit && (
                                    <button
                                      onClick={() => {
                                        setEditingMember(member);
                                        setOpenMenu(null);
                                      }}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-accent/10 hover:text-accent-light"
                                    >
                                      <Pencil className="h-4 w-4" />
                                      Edit Role
                                    </button>
                                  )}
                                  {member.isInvitation &&
                                    member.invitationToken && (
                                      <button
                                        onClick={() =>
                                          copyInviteLink(
                                            member.invitationToken!
                                          )
                                        }
                                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-accent/10 hover:text-accent-light"
                                      >
                                        <Copy className="h-4 w-4" />
                                        Copy Invite Link
                                      </button>
                                    )}
                                  {canRemove && (
                                    <button
                                      onClick={() => handleRemove(member)}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                                    >
                                      {member.isInvitation ? (
                                        <>
                                          <Ban className="h-4 w-4" />
                                          Revoke Invite
                                        </>
                                      ) : (
                                        <>
                                          <UserX className="h-4 w-4" />
                                          Remove
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <EditRoleModal
        open={!!editingMember}
        onClose={() => setEditingMember(null)}
        member={editingMember}
        currentUserRole={currentUserRole}
      />
    </>
  );
}
