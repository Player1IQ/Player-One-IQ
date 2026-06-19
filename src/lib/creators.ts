import type { PresenceStatus } from "@/lib/presence/types";

export type CreatorStatus = "active" | "inactive" | "pending" | "on-hold";

export type Platform =
  | "YouTube"
  | "Twitch"
  | "TikTok"
  | "Instagram"
  | "Kick";

export const platforms: Platform[] = [
  "YouTube",
  "Twitch",
  "TikTok",
  "Instagram",
  "Kick",
];

export const creatorStatuses: CreatorStatus[] = [
  "active",
  "inactive",
  "pending",
  "on-hold",
];

export const creatorStatusLabels: Record<CreatorStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  pending: "Pending",
  "on-hold": "On Hold",
};

export interface SocialHandle {
  platform: Platform;
  handle: string;
}

export interface CreatorRow {
  id: string;
  organization_id: string;
  name: string;
  email: string | null;
  primary_platform: string;
  social_handles: SocialHandle[];
  status: CreatorStatus;
  notes: string | null;
  avatar_url: string | null;
  availability_status: PresenceStatus;
  created_at: string;
  updated_at: string;
}

export interface Creator {
  id: string;
  organizationId: string;
  name: string;
  email: string | null;
  primaryPlatform: Platform;
  socialHandles: SocialHandle[];
  status: CreatorStatus;
  notes: string | null;
  createdAt: string;
  avatarUrl: string | null;
  availabilityStatus: PresenceStatus;
  avatarInitials: string;
  avatarColor: string;
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

export function getAvatarInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

export function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function formatCreatorDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function mapCreatorRow(row: CreatorRow): Creator {
  const primaryPlatform = platforms.includes(row.primary_platform as Platform)
    ? (row.primary_platform as Platform)
    : "YouTube";

  const socialHandles = Array.isArray(row.social_handles)
    ? row.social_handles.filter(
        (h): h is SocialHandle =>
          !!h &&
          typeof h === "object" &&
          "platform" in h &&
          "handle" in h &&
          typeof h.handle === "string"
      )
    : [];

  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    email: row.email,
    primaryPlatform,
    socialHandles,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    avatarUrl: row.avatar_url ?? null,
    availabilityStatus: row.availability_status ?? "inactive",
    avatarInitials: getAvatarInitials(row.name),
    avatarColor: getAvatarColor(row.id),
  };
}

export interface CreatorInput {
  name: string;
  email: string;
  primaryPlatform: Platform;
  status: CreatorStatus;
  availabilityStatus: PresenceStatus;
  socialHandles: SocialHandle[];
  notes: string;
}

export function getCreatorStats(creators: Creator[]) {
  return {
    totalCount: creators.length,
    activeCount: creators.filter((c) => c.status === "active").length,
    pendingCount: creators.filter((c) => c.status === "pending").length,
    onHoldCount: creators.filter((c) => c.status === "on-hold").length,
    inactiveCount: creators.filter((c) => c.status === "inactive").length,
  };
}
