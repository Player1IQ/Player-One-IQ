"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Pencil,
  UserX,
  Shield,
} from "lucide-react";
import {
  type TeamMember,
  type TeamRole,
  permissionMatrix,
  permissions,
  roleLabels,
} from "@/lib/team";
import { removeTeamMember } from "@/app/team/actions";
import { TeamMemberAvatar } from "./TeamMemberAvatar";
import { RoleBadge } from "./RoleBadge";
import { MemberStatusBadge } from "./MemberStatusBadge";
import { EditRoleModal } from "./EditRoleModal";

interface TeamMemberProfileProps {
  member: TeamMember;
  canManageTeam: boolean;
  currentUserRole: TeamRole | null;
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface-raised p-6 shadow-sm">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function TeamMemberProfile({
  member,
  canManageTeam,
  currentUserRole,
}: TeamMemberProfileProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const memberPermissions = permissionMatrix[member.role];
  const canEdit =
    canManageTeam &&
    member.role !== "owner" &&
    !(currentUserRole === "admin" && member.role === "admin");
  const canRemove = canEdit;

  async function handleRemove() {
    if (!confirm(`Remove ${member.email} from your team?`)) return;
    setDeleting(true);
    const result = await removeTeamMember(member.id);
    if ("error" in result && result.error) {
      alert(result.error);
      setDeleting(false);
      return;
    }
    router.push("/team");
    router.refresh();
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/team"
            className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-accent-light"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Team
          </Link>
          {canManageTeam && (canEdit || canRemove) && (
            <div className="flex gap-2">
              {canEdit && (
                <button
                  onClick={() => setEditOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-surface-overlay hover:text-white"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Role
                </button>
              )}
              {canRemove && (
                <button
                  onClick={handleRemove}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                >
                  <UserX className="h-4 w-4" />
                  Remove
                </button>
              )}
            </div>
          )}
        </div>

        <div className="relative overflow-hidden rounded-xl border border-border bg-surface-raised p-6 shadow-sm">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/5" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
            <TeamMemberAvatar
              initials={member.avatarInitials}
              color={member.avatarColor}
              size="lg"
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-white">{member.name}</h2>
                <MemberStatusBadge status={member.status} />
              </div>
              <p className="mt-1 text-gray-400">{member.email}</p>
              <div className="mt-3">
                <RoleBadge role={member.role} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface-raised p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
              <Mail className="h-3.5 w-3.5" />
              Email
            </div>
            <p className="mt-2 text-sm font-medium text-white">{member.email}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface-raised p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
              <Calendar className="h-3.5 w-3.5" />
              Joined
            </div>
            <p className="mt-2 text-sm font-medium text-white">
              {member.joinedDate}
            </p>
          </div>
        </div>

        <Section
          title="Permissions"
          description={`Access granted by the ${roleLabels[member.role]} role`}
        >
          <ul className="space-y-3">
            {permissions.map((perm) => {
              const level = memberPermissions[perm.key];
              return (
                <li
                  key={perm.key}
                  className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-200">
                        {perm.label}
                      </p>
                      <p className="text-xs text-gray-500">
                        {perm.description}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      level === "full"
                        ? "text-emerald-400"
                        : level === "read"
                          ? "text-sky-400"
                          : "text-gray-500"
                    }`}
                  >
                    {level === "full"
                      ? "Full access"
                      : level === "read"
                        ? "Read only"
                        : "No access"}
                  </span>
                </li>
              );
            })}
          </ul>
        </Section>
      </div>

      <EditRoleModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        member={member}
        currentUserRole={currentUserRole}
      />
    </>
  );
}
