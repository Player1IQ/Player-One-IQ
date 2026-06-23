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
  requiresLinkedCreator,
  requiresLinkedSponsor,
} from "@/lib/team";
import type { Creator } from "@/lib/creators";
import type { Sponsor } from "@/lib/sponsors";
import { removeTeamMember } from "@/app/team/actions";
import { TeamMemberAvatar } from "./TeamMemberAvatar";
import { RoleBadge } from "./RoleBadge";
import { MemberStatusBadge } from "./MemberStatusBadge";
import { EditRoleModal } from "./EditRoleModal";
import { PresenceBadge } from "@/components/presence/PresenceBadge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";

interface TeamMemberProfileProps {
  member: TeamMember;
  creators: Creator[];
  sponsors: Sponsor[];
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
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

export function TeamMemberProfile({
  member,
  creators,
  sponsors,
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
  const fullAccessCount = permissions.filter(
    (perm) => memberPermissions[perm.key] === "full"
  ).length;
  const linkedCreatorName = member.linkedCreatorId
    ? creators.find((c) => c.id === member.linkedCreatorId)?.name
    : null;
  const linkedSponsorName = member.linkedSponsorId
    ? sponsors.find((s) => s.id === member.linkedSponsorId)?.companyName
    : null;

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
      <div className="space-y-6 animate-fade-in">
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
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4" />
                  Edit Role
                </Button>
              )}
              {canRemove && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleRemove}
                  disabled={deleting}
                >
                  <UserX className="h-4 w-4" />
                  Remove
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06]">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-surface-raised to-surface" />
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="relative px-6 py-8 sm:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <TeamMemberAvatar
                initials={member.avatarInitials}
                color={member.avatarColor}
                size="lg"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-3xl font-bold text-white">{member.name}</h2>
                  <MemberStatusBadge status={member.status} />
                </div>
                <p className="mt-1 text-gray-400">{member.email}</p>
                <div className="mt-2">
                  <PresenceBadge status={member.presenceStatus} size="md" />
                </div>
                <div className="mt-3">
                  <RoleBadge role={member.role} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            title="Role"
            value={roleLabels[member.role]}
            subtitle="Access level"
            icon={Shield}
            iconColor="text-violet-400"
          />
          <MetricCard
            title="Full Access"
            value={String(fullAccessCount)}
            subtitle={`of ${permissions.length} permission areas`}
            icon={Shield}
            iconColor="text-emerald-400"
          />
          <MetricCard
            title="Joined"
            value={member.joinedDate.split(",")[0] ?? member.joinedDate}
            subtitle="Team member since"
            icon={Calendar}
            iconColor="text-accent-light"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
              <Mail className="h-3.5 w-3.5" />
              Email
            </div>
            <p className="mt-2 text-sm font-medium text-white">{member.email}</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
              <Calendar className="h-3.5 w-3.5" />
              Joined
            </div>
            <p className="mt-2 text-sm font-medium text-white">
              {member.joinedDate}
            </p>
          </div>
          {requiresLinkedCreator(member.role) ? (
            <div className="rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-4 backdrop-blur-sm sm:col-span-2">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                <Shield className="h-3.5 w-3.5" />
                Linked roster profile
              </div>
              <p className="mt-2 text-sm font-medium text-white">
                {linkedCreatorName ?? "Not linked"}
              </p>
            </div>
          ) : null}
          {requiresLinkedSponsor(member.role) ? (
            <div className="rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-4 backdrop-blur-sm sm:col-span-2">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                <Shield className="h-3.5 w-3.5" />
                Linked sponsor company
              </div>
              <p className="mt-2 text-sm font-medium text-white">
                {linkedSponsorName ?? "Not linked"}
              </p>
            </div>
          ) : null}
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
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
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
                          : level === "scoped"
                            ? "text-amber-400"
                            : "text-gray-500"
                    }`}
                  >
                    {level === "full"
                      ? "Full access"
                      : level === "read"
                        ? "Read only"
                        : level === "scoped"
                          ? "Own profile only"
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
        creators={creators}
        sponsors={sponsors}
      />
    </>
  );
}
