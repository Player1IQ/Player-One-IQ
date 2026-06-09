export type TeamRole = "owner" | "admin" | "manager" | "viewer";

export type MemberStatus = "active" | "pending" | "inactive";

export type PermissionLevel = "full" | "read" | "none";

export type PermissionKey =
  | "creators"
  | "sponsors"
  | "contracts"
  | "team"
  | "settings";

export const teamRoles: TeamRole[] = [
  "owner",
  "admin",
  "manager",
  "viewer",
];

export const invitableRoles: Exclude<TeamRole, "owner">[] = [
  "admin",
  "manager",
  "viewer",
];

export const roleLabels: Record<TeamRole, string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  viewer: "Viewer",
};

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  description: string;
}

export const permissions: PermissionDefinition[] = [
  {
    key: "creators",
    label: "Creators",
    description: "View and manage creator profiles",
  },
  {
    key: "sponsors",
    label: "Sponsors",
    description: "View and manage sponsor partnerships",
  },
  {
    key: "contracts",
    label: "Contracts",
    description: "View and manage sponsorship agreements",
  },
  {
    key: "team",
    label: "Team",
    description: "Invite members and manage roles",
  },
  {
    key: "settings",
    label: "Settings",
    description: "Organization and workspace settings",
  },
];

export const permissionMatrix: Record<
  TeamRole,
  Record<PermissionKey, PermissionLevel>
> = {
  owner: {
    creators: "full",
    sponsors: "full",
    contracts: "full",
    team: "full",
    settings: "full",
  },
  admin: {
    creators: "full",
    sponsors: "full",
    contracts: "full",
    team: "full",
    settings: "read",
  },
  manager: {
    creators: "full",
    sponsors: "full",
    contracts: "full",
    team: "none",
    settings: "read",
  },
  viewer: {
    creators: "read",
    sponsors: "read",
    contracts: "read",
    team: "read",
    settings: "none",
  },
};

export interface TeamMemberRow {
  id: string;
  organization_id: string;
  user_id: string | null;
  email: string;
  role: TeamRole;
  status: "active" | "inactive";
  invited_by: string | null;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamInvitationRow {
  id: string;
  organization_id: string;
  email: string;
  role: Exclude<TeamRole, "owner">;
  token: string;
  invited_by: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface TeamMember {
  id: string;
  organizationId: string;
  userId: string | null;
  email: string;
  name: string;
  role: TeamRole;
  status: MemberStatus;
  avatarInitials: string;
  avatarColor: string;
  joinedDate: string;
  isInvitation: boolean;
  invitationToken?: string;
}

const avatarColors = [
  "from-violet-500 to-purple-600",
  "from-fuchsia-500 to-pink-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-red-600",
  "from-indigo-500 to-blue-600",
  "from-cyan-500 to-blue-500",
];

export function getAvatarInitials(name: string, email: string): string {
  const trimmed = name.trim();
  if (trimmed && trimmed !== email) {
    return trimmed
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?";
  }
  return email[0]?.toUpperCase() ?? "?";
}

export function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function formatJoinedDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local
    .split(/[._-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function mapTeamMemberRow(row: TeamMemberRow): TeamMember {
  const name = displayNameFromEmail(row.email);

  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    email: row.email,
    name,
    role: row.role,
    status: row.status,
    avatarInitials: getAvatarInitials(name, row.email),
    avatarColor: getAvatarColor(row.id),
    joinedDate: formatJoinedDate(row.joined_at ?? row.created_at),
    isInvitation: false,
  };
}

export function mapInvitationRow(row: TeamInvitationRow): TeamMember {
  const name = displayNameFromEmail(row.email);

  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: null,
    email: row.email,
    name,
    role: row.role,
    status: "pending",
    avatarInitials: getAvatarInitials(name, row.email),
    avatarColor: getAvatarColor(row.id),
    joinedDate: "—",
    isInvitation: true,
    invitationToken: row.token,
  };
}

export function getTeamStats(members: TeamMember[]) {
  const active = members.filter((m) => m.status === "active");
  const pending = members.filter((m) => m.status === "pending");
  const uniqueRoles = new Set(
    active.map((m) => m.role).filter((r) => r !== "owner")
  );

  return {
    total: members.length,
    activeCount: active.length,
    pendingCount: pending.length,
    assignedRolesCount: uniqueRoles.size,
  };
}

export function getRoleColor(role: TeamRole): string {
  const colors: Record<TeamRole, string> = {
    owner: "bg-violet-500/10 text-violet-400 ring-violet-500/20",
    admin: "bg-purple-500/10 text-purple-400 ring-purple-500/20",
    manager: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
    viewer: "bg-gray-500/10 text-gray-400 ring-gray-500/20",
  };
  return colors[role];
}

export function canManageTeam(role: TeamRole | null): boolean {
  return role === "owner" || role === "admin";
}

export function canWriteData(role: TeamRole | null): boolean {
  return role === "owner" || role === "admin" || role === "manager";
}
