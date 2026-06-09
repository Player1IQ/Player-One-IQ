"use client";

import Link from "next/link";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  UserX,
  Copy,
  Ban,
  Mail,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type TeamMember, type TeamRole } from "@/lib/team";
import {
  removeTeamMember,
  revokeInvitation,
} from "@/app/team/actions";
import { copyTextToClipboard, getErrorMessage } from "@/lib/safe-action";
import { TeamMemberAvatar } from "./TeamMemberAvatar";
import { RoleBadge } from "./RoleBadge";
import { MemberStatusBadge } from "./MemberStatusBadge";
import { EditRoleModal } from "./EditRoleModal";
import { ResendInviteModal } from "./ResendInviteModal";

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
  const [resendInvite, setResendInvite] = useState<TeamMember | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleRemove(member: TeamMember) {
    const label = member.isInvitation ? "revoke this invitation" : "remove this member";
    if (!confirm(`Are you sure you want to ${label}?`)) return;

    try {
      const result = member.isInvitation
        ? await revokeInvitation(member.id)
        : await removeTeamMember(member.id);

      if ("error" in result && result.error) {
        alert(result.error);
        return;
      }

      setOpenMenu(null);
      router.refresh();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  async function copyInviteLink(token: string) {
    try {
      const link = `${window.location.origin}/invite/${token}`;
      await copyTextToClipboard(link);
      setOpenMenu(null);
      setActionError(null);
      setCopyFeedback("Invite link copied to clipboard.");
      setTimeout(() => setCopyFeedback(null), 3000);
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  }

  function handleRowClick(member: TeamMember) {
    if (member.isInvitation) {
      if (canManageTeam) {
        setResendInvite(member);
      }
      return;
    }
    router.push(`/team/${member.id}`);
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
      {copyFeedback && (
        <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {copyFeedback}
        </div>
      )}
      {actionError && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {actionError}
        </div>
      )}
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

                const showActions = canEdit || canRemove || member.isInvitation;

                return (
                  <tr
                    key={member.id}
                    onClick={() => handleRowClick(member)}
                    className="group cursor-pointer transition-colors hover:bg-accent/[0.03]"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
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
                          {member.isInvitation && canManageTeam && (
                            <p className="mt-1 text-xs text-amber-400">
                              Click row to resend invite
                            </p>
                          )}
                        </div>
                      </div>
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
                        {showActions && (
                          <>
                            {member.isInvitation && (
                              <div className="mb-2 flex flex-wrap gap-2">
                                {member.invitationToken && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void copyInviteLink(member.invitationToken!);
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-gray-300 hover:border-accent/30 hover:text-accent-light"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                    Copy
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setResendInvite(member);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-300 hover:bg-amber-500/20"
                                >
                                  <Mail className="h-3.5 w-3.5" />
                                  Resend
                                </button>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenu(
                                  openMenu === member.id ? null : member.id
                                );
                              }}
                              className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-surface-overlay hover:text-gray-200"
                              aria-label="Actions"
                            >
                              <MoreHorizontal className="h-5 w-5" />
                            </button>
                            {openMenu === member.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenu(null);
                                  }}
                                />
                                <div
                                  className="absolute right-6 top-12 z-50 w-48 rounded-lg border border-border bg-surface-overlay py-1 shadow-xl ring-1 ring-white/5"
                                  onClick={(e) => e.stopPropagation()}
                                >
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
                                      type="button"
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
                                  {member.isInvitation && member.invitationToken && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        void copyInviteLink(member.invitationToken!);
                                      }}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-accent/10 hover:text-accent-light"
                                    >
                                      <Copy className="h-4 w-4" />
                                      Copy invite link
                                    </button>
                                  )}
                                  {member.isInvitation && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setResendInvite(member);
                                        setOpenMenu(null);
                                      }}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-accent/10 hover:text-accent-light"
                                    >
                                      <Mail className="h-4 w-4" />
                                      Resend invite link
                                    </button>
                                  )}
                                  {canRemove && (
                                    <button
                                      type="button"
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

      <ResendInviteModal
        open={!!resendInvite}
        onClose={() => setResendInvite(null)}
        invitationId={resendInvite?.id ?? ""}
        email={resendInvite?.email ?? ""}
      />
    </>
  );
}
