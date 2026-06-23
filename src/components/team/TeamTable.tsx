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
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
import { PresenceBadge } from "@/components/presence/PresenceBadge";

import type { Creator } from "@/lib/creators";
import type { Sponsor } from "@/lib/sponsors";

interface TeamTableProps {
  members: TeamMember[];
  creators: Creator[];
  sponsors: Sponsor[];
  canManageTeam: boolean;
  currentUserRole: TeamRole | null;
}

interface MenuPosition {
  anchorTop: number;
  anchorBottom: number;
  left: number;
  placement: "above" | "below";
}

const MENU_WIDTH_PX = 192;
const MENU_ESTIMATED_HEIGHT_PX = 220;

export function TeamTable({
  members,
  creators,
  sponsors,
  canManageTeam,
  currentUserRole,
}: TeamTableProps) {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
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

      closeMenu();
      router.refresh();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  async function copyInviteLink(token: string) {
    try {
      const link = `${window.location.origin}/invite/${token}`;
      await copyTextToClipboard(link);
      closeMenu();
      setActionError(null);
      setCopyFeedback("Invite link copied to clipboard.");
      setTimeout(() => setCopyFeedback(null), 3000);
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  }

  function closeMenu() {
    setOpenMenu(null);
    setMenuPosition(null);
  }

  function openActionsMenu(memberId: string, button: HTMLButtonElement) {
    if (openMenu === memberId) {
      closeMenu();
      return;
    }

    const rect = button.getBoundingClientRect();
    const placement =
      rect.bottom + MENU_ESTIMATED_HEIGHT_PX > window.innerHeight - 8
        ? "above"
        : "below";

    setMenuPosition({
      anchorTop: rect.top,
      anchorBottom: rect.bottom,
      left: Math.max(8, rect.right - MENU_WIDTH_PX),
      placement,
    });
    setOpenMenu(memberId);
  }

  useEffect(() => {
    if (!openMenu) return;

    function handleDismiss() {
      closeMenu();
    }

    window.addEventListener("resize", handleDismiss);
    window.addEventListener("scroll", handleDismiss, true);
    return () => {
      window.removeEventListener("resize", handleDismiss);
      window.removeEventListener("scroll", handleDismiss, true);
    };
  }, [openMenu]);

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
    return null;
  }

  return (
    <>
      {copyFeedback ? (
        <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {copyFeedback}
        </div>
      ) : null}
      {actionError ? (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {actionError}
        </div>
      ) : null}

      <div className="space-y-3 md:hidden">
        {members.map((member) => {
          const canEdit =
            canManageTeam &&
            !member.isInvitation &&
            member.role !== "owner" &&
            !(currentUserRole === "admin" && member.role === "admin");

          return (
            <div
              key={member.id}
              className="rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-4"
            >
              <div className="flex items-start gap-3">
                <TeamMemberAvatar
                  initials={member.avatarInitials}
                  color={member.avatarColor}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-100">{member.name}</p>
                    <RoleBadge role={member.role} />
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">{member.email}</p>
                  {!member.isInvitation ? (
                    <div className="mt-1">
                      <PresenceBadge status={member.presenceStatus} />
                    </div>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <MemberStatusBadge status={member.status} />
                    <span className="text-xs text-gray-500">
                      Joined {member.joinedDate}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {member.isInvitation ? (
                  <>
                    {member.invitationToken ? (
                      <button
                        type="button"
                        onClick={() => void copyInviteLink(member.invitationToken!)}
                        className="flex-1 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5"
                      >
                        Copy link
                      </button>
                    ) : null}
                    {canManageTeam ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setResendInvite(member)}
                          className="flex-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-200"
                        >
                          Resend invite
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleRemove(member)}
                          className="flex-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300"
                        >
                          Revoke invite
                        </button>
                      </>
                    ) : null}
                  </>
                ) : (
                  <Link
                    href={`/team/${member.id}`}
                    className="flex-1 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-center text-xs font-medium text-accent-light"
                  >
                    View profile
                  </Link>
                )}
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => setEditingMember(member)}
                    className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5"
                  >
                    Edit role
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden rounded-2xl border border-white/[0.06] bg-surface-raised/80 shadow-card backdrop-blur-sm md:block">
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
                          {!member.isInvitation ? (
                            <div className="mt-1">
                              <PresenceBadge status={member.presenceStatus} />
                            </div>
                          ) : null}
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
                                openActionsMenu(member.id, e.currentTarget);
                              }}
                              className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-surface-overlay hover:text-gray-200"
                              aria-label="Actions"
                              aria-expanded={openMenu === member.id}
                            >
                              <MoreHorizontal className="h-5 w-5" />
                            </button>
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
        creators={creators}
        sponsors={sponsors}
      />

      <ResendInviteModal
        open={!!resendInvite}
        onClose={() => setResendInvite(null)}
        invitationId={resendInvite?.id ?? ""}
        email={resendInvite?.email ?? ""}
      />

      {openMenu && menuPosition
        ? createPortal(
            (() => {
              const member = members.find((entry) => entry.id === openMenu);
              if (!member) return null;

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
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={closeMenu}
                  />
                  <div
                    className="fixed z-50 w-48 rounded-lg border border-border bg-surface-overlay py-1 shadow-xl ring-1 ring-white/5"
                    style={{
                      left: menuPosition.left,
                      top:
                        menuPosition.placement === "below"
                          ? menuPosition.anchorBottom + 4
                          : undefined,
                      bottom:
                        menuPosition.placement === "above"
                          ? window.innerHeight - menuPosition.anchorTop + 4
                          : undefined,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!member.isInvitation && (
                      <Link
                        href={`/team/${member.id}`}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-accent/10 hover:text-accent-light"
                        onClick={closeMenu}
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
                          closeMenu();
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
                          closeMenu();
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
                        onClick={() => void handleRemove(member)}
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
              );
            })(),
            document.body
          )
        : null}
    </>
  );
}
