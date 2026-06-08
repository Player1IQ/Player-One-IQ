import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Users,
  Building2,
  FileText,
  Shield,
} from "lucide-react";
import type { TeamMember } from "@/lib/team";
import { permissionMatrix, permissions } from "@/lib/team";
import { TeamMemberAvatar } from "./TeamMemberAvatar";
import { RoleBadge } from "./RoleBadge";
import { MemberStatusBadge } from "./MemberStatusBadge";

interface TeamMemberProfileProps {
  member: TeamMember;
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

export function TeamMemberProfile({ member }: TeamMemberProfileProps) {
  const memberPermissions = permissionMatrix[member.role];

  return (
    <div className="space-y-6">
      <Link
        href="/team"
        className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-accent-light"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Team
      </Link>

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
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <RoleBadge role={member.role} />
              <span className="text-sm text-gray-500">{member.department}</span>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-400">
              {member.bio}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface-raised p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
            <Users className="h-3.5 w-3.5" />
            Assigned Creators
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {member.assignedCreators}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface-raised p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
            <Building2 className="h-3.5 w-3.5" />
            Assigned Sponsors
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {member.assignedSponsors}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface-raised p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
            <FileText className="h-3.5 w-3.5" />
            Assigned Contracts
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {member.assignedContracts}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Contact Information">
          <dl className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <dt className="text-xs text-gray-500">Email</dt>
                <dd className="text-sm text-gray-200">{member.email}</dd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gray-500" />
              <div>
                <dt className="text-xs text-gray-500">Phone</dt>
                <dd className="text-sm text-gray-200">{member.phone}</dd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <dt className="text-xs text-gray-500">Joined</dt>
                <dd className="text-sm text-gray-200">{member.joinedDate}</dd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <dt className="text-xs text-gray-500">Last Login</dt>
                <dd className="text-sm text-gray-200">{member.lastLogin}</dd>
              </div>
            </div>
          </dl>
        </Section>

        <Section
          title="Role Permissions"
          description={`Access granted via ${member.role} role`}
        >
          <ul className="space-y-2">
            {permissions.map((perm) => {
              const level = memberPermissions[perm.key];
              return (
                <li
                  key={perm.key}
                  className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface px-4 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-gray-500" />
                    <span className="text-sm text-gray-300">{perm.label}</span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                      level === "full"
                        ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                        : level === "limited"
                          ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                          : "bg-gray-500/10 text-gray-500 ring-gray-500/20"
                    }`}
                  >
                    {level === "full"
                      ? "Full"
                      : level === "limited"
                        ? "Limited"
                        : "None"}
                  </span>
                </li>
              );
            })}
          </ul>
          <Link
            href="/team/permissions"
            className="mt-4 inline-flex text-sm text-accent-light transition-colors hover:text-white"
          >
            View full permission matrix →
          </Link>
        </Section>
      </div>

      <Section title="Internal Notes" description="Team-only context">
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-4">
          <p className="text-sm leading-relaxed text-gray-300">
            {member.internalNotes}
          </p>
        </div>
      </Section>
    </div>
  );
}
