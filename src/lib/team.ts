export type TeamRole =
  | "owner"
  | "admin"
  | "manager"
  | "partnerships"
  | "talent_manager"
  | "member"
  | "viewer"
  | "player"
  | "content_creator"
  | "sponsor";

export type MemberStatus = "active" | "pending" | "inactive";

export type PermissionLevel = "full" | "read" | "scoped" | "none";

export type PermissionKey =
  | "creators"
  | "sponsors"
  | "contracts"
  | "opportunities"
  | "campaigns"
  | "messages"
  | "team"
  | "settings"
  | "billing";

export const staffRoles: TeamRole[] = [
  "owner",
  "admin",
  "manager",
  "partnerships",
  "talent_manager",
  "member",
  "viewer",
];

export const creatorPortalRoles: TeamRole[] = ["player", "content_creator"];
export const sponsorPortalRoles: TeamRole[] = ["sponsor"];
export const portalRoles: TeamRole[] = [...creatorPortalRoles, ...sponsorPortalRoles];

export const teamRoles: TeamRole[] = [...staffRoles, ...portalRoles];

export const invitableStaffRoles: Exclude<TeamRole, "owner">[] = [
  "admin",
  "manager",
  "partnerships",
  "talent_manager",
  "member",
  "viewer",
];

export const invitablePortalRoles: Exclude<TeamRole, "owner">[] = [
  "player",
  "content_creator",
  "sponsor",
];

export const invitableRoles: Exclude<TeamRole, "owner">[] = [
  ...invitableStaffRoles,
  ...invitablePortalRoles,
];

export const roleLabels: Record<TeamRole, string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  partnerships: "Partnerships",
  talent_manager: "Talent Manager",
  member: "Member",
  viewer: "Viewer",
  player: "Player",
  content_creator: "Content Creator",
  sponsor: "Sponsor Contact",
};

export const roleDescriptions: Record<TeamRole, string> = {
  owner: "Full access including billing and ownership transfer",
  admin: "User and role management, settings, all data except billing transfer",
  manager: "Creators, opportunities, contracts, and deal operations",
  partnerships: "Sponsors, opportunities, contracts, and messaging",
  talent_manager: "Creators, applications, and assigned deals",
  member: "General read access with messaging and limited collaboration",
  viewer: "Read-only access across the organization",
  player: "Portal access to own roster profile, contracts, and deliverables",
  content_creator:
    "Portal access to own profile, contracts, campaigns, opportunities, and content",
  sponsor:
    "Portal access to your company profile, contracts, campaigns, and deal rooms (read-only)",
};

export const memberStatusLabels: Record<MemberStatus, string> = {
  active: "Active",
  pending: "Pending",
  inactive: "Inactive",
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
    description: "View and manage creator roster profiles",
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
    key: "opportunities",
    label: "Opportunities",
    description: "View and manage sponsorship opportunities",
  },
  {
    key: "campaigns",
    label: "Campaigns",
    description: "View and manage sponsor campaigns",
  },
  {
    key: "messages",
    label: "Messages",
    description: "Team and deal room messaging",
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
  {
    key: "billing",
    label: "Billing",
    description: "Subscription and payment management",
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
    opportunities: "full",
    campaigns: "full",
    messages: "full",
    team: "full",
    settings: "full",
    billing: "full",
  },
  admin: {
    creators: "full",
    sponsors: "full",
    contracts: "full",
    opportunities: "full",
    campaigns: "full",
    messages: "full",
    team: "full",
    settings: "full",
    billing: "read",
  },
  manager: {
    creators: "full",
    sponsors: "full",
    contracts: "full",
    opportunities: "full",
    campaigns: "read",
    messages: "read",
    team: "none",
    settings: "read",
    billing: "none",
  },
  partnerships: {
    creators: "read",
    sponsors: "full",
    contracts: "full",
    opportunities: "full",
    campaigns: "read",
    messages: "full",
    team: "none",
    settings: "none",
    billing: "none",
  },
  talent_manager: {
    creators: "full",
    sponsors: "read",
    contracts: "read",
    opportunities: "read",
    campaigns: "read",
    messages: "read",
    team: "none",
    settings: "none",
    billing: "none",
  },
  member: {
    creators: "read",
    sponsors: "read",
    contracts: "read",
    opportunities: "read",
    campaigns: "read",
    messages: "full",
    team: "read",
    settings: "none",
    billing: "none",
  },
  viewer: {
    creators: "read",
    sponsors: "read",
    contracts: "read",
    opportunities: "read",
    campaigns: "read",
    messages: "read",
    team: "read",
    settings: "none",
    billing: "none",
  },
  player: {
    creators: "scoped",
    sponsors: "none",
    contracts: "scoped",
    opportunities: "none",
    campaigns: "none",
    messages: "full",
    team: "none",
    settings: "none",
    billing: "none",
  },
  content_creator: {
    creators: "scoped",
    sponsors: "none",
    contracts: "scoped",
    opportunities: "scoped",
    campaigns: "scoped",
    messages: "full",
    team: "none",
    settings: "none",
    billing: "none",
  },
  sponsor: {
    creators: "none",
    sponsors: "scoped",
    contracts: "scoped",
    opportunities: "none",
    campaigns: "scoped",
    messages: "read",
    team: "none",
    settings: "none",
    billing: "none",
  },
};

export interface TeamMemberRow {
  id: string;
  organization_id: string;
  user_id: string | null;
  email: string;
  role: TeamRole;
  status: "active" | "inactive";
  linked_creator_id: string | null;
  linked_sponsor_id: string | null;
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
  linked_creator_id: string | null;
  linked_sponsor_id: string | null;
  token: string;
  invited_by: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

import type { PresenceStatus } from "@/lib/presence/types";

export interface TeamMember {
  id: string;
  organizationId: string;
  userId: string | null;
  email: string;
  name: string;
  role: TeamRole;
  status: MemberStatus;
  linkedCreatorId: string | null;
  linkedSponsorId: string | null;
  presenceStatus: PresenceStatus;
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

export function mapTeamMemberRow(
  row: TeamMemberRow,
  presenceStatus: PresenceStatus = "inactive"
): TeamMember {
  const name = displayNameFromEmail(row.email);

  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    email: row.email,
    name,
    role: row.role,
    status: row.status,
    linkedCreatorId: row.linked_creator_id,
    linkedSponsorId: row.linked_sponsor_id,
    presenceStatus,
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
    linkedCreatorId: row.linked_creator_id,
    linkedSponsorId: row.linked_sponsor_id,
    presenceStatus: "inactive",
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
    partnerships: "bg-teal-500/10 text-teal-400 ring-teal-500/20",
    talent_manager: "bg-cyan-500/10 text-cyan-400 ring-cyan-500/20",
    member: "bg-indigo-500/10 text-indigo-400 ring-indigo-500/20",
    viewer: "bg-gray-500/10 text-gray-400 ring-gray-500/20",
    player: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
    content_creator: "bg-orange-500/10 text-orange-400 ring-orange-500/20",
    sponsor: "bg-teal-500/10 text-teal-400 ring-teal-500/20",
  };
  return colors[role];
}

export function isCreatorPortalRole(role: TeamRole | null): boolean {
  return role === "player" || role === "content_creator";
}

export function isSponsorPortalRole(role: TeamRole | null): boolean {
  return role === "sponsor";
}

export function isPortalRole(role: TeamRole | null): boolean {
  return isCreatorPortalRole(role) || isSponsorPortalRole(role);
}

export function requiresLinkedCreator(role: TeamRole): boolean {
  return isCreatorPortalRole(role);
}

export function requiresLinkedSponsor(role: TeamRole): boolean {
  return isSponsorPortalRole(role);
}

export function requiresPortalLink(role: TeamRole): boolean {
  return requiresLinkedCreator(role) || requiresLinkedSponsor(role);
}

export function getPermissionLevel(
  role: TeamRole | null,
  key: PermissionKey
): PermissionLevel {
  if (!role) return "none";
  return permissionMatrix[role][key];
}

export function hasFullAccess(
  role: TeamRole | null,
  key: PermissionKey
): boolean {
  return getPermissionLevel(role, key) === "full";
}

export function hasReadAccess(
  role: TeamRole | null,
  key: PermissionKey
): boolean {
  const level = getPermissionLevel(role, key);
  return level === "full" || level === "read" || level === "scoped";
}

export function canManageTeam(role: TeamRole | null): boolean {
  return role === "owner" || role === "admin";
}

/** True when the role has full write on at least one staff resource area. */
export function canWriteData(role: TeamRole | null): boolean {
  if (!role || isPortalRole(role)) return false;
  return (Object.keys(permissionMatrix[role]) as PermissionKey[]).some(
    (key) => permissionMatrix[role][key] === "full"
  );
}

export const roleGroups: Array<{
  label: string;
  roles: Exclude<TeamRole, "owner">[];
}> = [
  { label: "Staff", roles: invitableStaffRoles },
  { label: "Portal", roles: invitablePortalRoles },
];

export function canAccessStaffDashboard(role: TeamRole | null): boolean {
  if (!role) return false;
  return !isPortalRole(role);
}

export function canUseMessaging(role: TeamRole | null): boolean {
  if (!role) return false;
  const level = getPermissionLevel(role, "messages");
  return level === "full" || level === "read";
}
