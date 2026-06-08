export type TeamRole =
  | "Organization Owner"
  | "Admin"
  | "Talent Manager"
  | "Sponsorship Manager"
  | "Editor"
  | "Viewer";

export type MemberStatus = "active" | "pending" | "inactive";

export type Department =
  | "Leadership"
  | "Talent"
  | "Partnerships"
  | "Operations"
  | "Content"
  | "Analytics";

export type PermissionLevel = "full" | "limited" | "none";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  avatarColor: string;
  role: TeamRole;
  department: Department;
  status: MemberStatus;
  lastLogin: string;
  joinedDate: string;
  phone: string;
  bio: string;
  assignedCreators: number;
  assignedSponsors: number;
  assignedContracts: number;
  internalNotes: string;
}

export interface ActivityLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  timestamp: string;
  type: "create" | "update" | "delete" | "login" | "invite" | "permission";
}

export type PermissionKey =
  | "creators"
  | "sponsors"
  | "contracts"
  | "team"
  | "analytics"
  | "content"
  | "billing"
  | "export"
  | "settings";

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  description: string;
}

export const permissions: PermissionDefinition[] = [
  {
    key: "creators",
    label: "Manage Creators",
    description: "Create, edit, and archive creator profiles",
  },
  {
    key: "sponsors",
    label: "Manage Sponsors",
    description: "Manage sponsor accounts and partnerships",
  },
  {
    key: "contracts",
    label: "Manage Contracts",
    description: "Create and manage sponsorship agreements",
  },
  {
    key: "team",
    label: "Manage Team",
    description: "Invite members and assign roles",
  },
  {
    key: "analytics",
    label: "View Analytics",
    description: "Access dashboards and performance reports",
  },
  {
    key: "content",
    label: "Edit Content",
    description: "Edit deliverables and campaign content",
  },
  {
    key: "billing",
    label: "Manage Billing",
    description: "Access invoices and payment settings",
  },
  {
    key: "export",
    label: "Export Data",
    description: "Download reports and data exports",
  },
  {
    key: "settings",
    label: "Workspace Settings",
    description: "Configure organization preferences",
  },
];

export const roles: TeamRole[] = [
  "Organization Owner",
  "Admin",
  "Talent Manager",
  "Sponsorship Manager",
  "Editor",
  "Viewer",
];

export const permissionMatrix: Record<
  TeamRole,
  Record<PermissionKey, PermissionLevel>
> = {
  "Organization Owner": {
    creators: "full",
    sponsors: "full",
    contracts: "full",
    team: "full",
    analytics: "full",
    content: "full",
    billing: "full",
    export: "full",
    settings: "full",
  },
  Admin: {
    creators: "full",
    sponsors: "full",
    contracts: "full",
    team: "full",
    analytics: "full",
    content: "full",
    billing: "limited",
    export: "full",
    settings: "limited",
  },
  "Talent Manager": {
    creators: "full",
    sponsors: "limited",
    contracts: "limited",
    team: "none",
    analytics: "full",
    content: "limited",
    billing: "none",
    export: "limited",
    settings: "none",
  },
  "Sponsorship Manager": {
    creators: "limited",
    sponsors: "full",
    contracts: "full",
    team: "none",
    analytics: "full",
    content: "limited",
    billing: "none",
    export: "limited",
    settings: "none",
  },
  Editor: {
    creators: "limited",
    sponsors: "none",
    contracts: "limited",
    team: "none",
    analytics: "limited",
    content: "full",
    billing: "none",
    export: "none",
    settings: "none",
  },
  Viewer: {
    creators: "limited",
    sponsors: "limited",
    contracts: "limited",
    team: "none",
    analytics: "limited",
    content: "limited",
    billing: "none",
    export: "none",
    settings: "none",
  },
};

export const teamMembers: TeamMember[] = [
  {
    id: "tm-001",
    name: "Jordan Hayes",
    email: "jordan@playeroneiq.com",
    avatarInitials: "JH",
    avatarColor: "from-violet-500 to-purple-600",
    role: "Organization Owner",
    department: "Leadership",
    status: "active",
    lastLogin: "Jun 8, 2026 · 2:14 PM",
    joinedDate: "Jan 2022",
    phone: "+1 (415) 555-0100",
    bio: "Founder & CEO. Oversees platform strategy, key partnerships, and organizational growth.",
    assignedCreators: 128,
    assignedSponsors: 47,
    assignedContracts: 93,
    internalNotes: "Primary decision-maker. All billing and legal escalations route here.",
  },
  {
    id: "tm-002",
    name: "Mia Rodriguez",
    email: "mia@playeroneiq.com",
    avatarInitials: "MR",
    avatarColor: "from-fuchsia-500 to-pink-600",
    role: "Admin",
    department: "Operations",
    status: "active",
    lastLogin: "Jun 8, 2026 · 11:42 AM",
    joinedDate: "Mar 2022",
    phone: "+1 (415) 555-0101",
    bio: "Head of Operations. Manages day-to-day platform administration and team coordination.",
    assignedCreators: 128,
    assignedSponsors: 47,
    assignedContracts: 93,
    internalNotes: "De facto admin for all modules. Handles onboarding for new team members.",
  },
  {
    id: "tm-003",
    name: "Ethan Park",
    email: "ethan@playeroneiq.com",
    avatarInitials: "EP",
    avatarColor: "from-blue-500 to-cyan-600",
    role: "Talent Manager",
    department: "Talent",
    status: "active",
    lastLogin: "Jun 7, 2026 · 6:30 PM",
    joinedDate: "Jun 2023",
    phone: "+1 (310) 555-0102",
    bio: "Senior Talent Manager. Manages creator roster, onboarding, and performance reviews.",
    assignedCreators: 42,
    assignedSponsors: 0,
    assignedContracts: 28,
    internalNotes: "Owns CreatorMike, SarahStreams, and GamePro accounts. Strong negotiator.",
  },
  {
    id: "tm-004",
    name: "Ava Thompson",
    email: "ava@playeroneiq.com",
    avatarInitials: "AT",
    avatarColor: "from-emerald-500 to-teal-600",
    role: "Talent Manager",
    department: "Talent",
    status: "active",
    lastLogin: "Jun 8, 2026 · 9:15 AM",
    joinedDate: "Sep 2023",
    phone: "+1 (310) 555-0103",
    bio: "Talent Manager focused on emerging creators and platform growth strategies.",
    assignedCreators: 36,
    assignedSponsors: 0,
    assignedContracts: 19,
    internalNotes: "Leading TechVibes onboarding. Specializes in TikTok-first creators.",
  },
  {
    id: "tm-005",
    name: "Lucas Bennett",
    email: "lucas@playeroneiq.com",
    avatarInitials: "LB",
    avatarColor: "from-amber-500 to-orange-600",
    role: "Sponsorship Manager",
    department: "Partnerships",
    status: "active",
    lastLogin: "Jun 8, 2026 · 8:00 AM",
    joinedDate: "Feb 2023",
    phone: "+1 (212) 555-0104",
    bio: "Senior Sponsorship Manager. Owns Nike, Red Bull, and Adidas relationships.",
    assignedCreators: 0,
    assignedSponsors: 18,
    assignedContracts: 34,
    internalNotes: "Top closer on sponsorship deals. Pipeline review every Monday.",
  },
  {
    id: "tm-006",
    name: "Sophie Chen",
    email: "sophie@playeroneiq.com",
    avatarInitials: "SC",
    avatarColor: "from-rose-500 to-red-600",
    role: "Sponsorship Manager",
    department: "Partnerships",
    status: "active",
    lastLogin: "Jun 6, 2026 · 4:45 PM",
    joinedDate: "Nov 2024",
    phone: "+1 (212) 555-0105",
    bio: "Sponsorship Manager for tech and consumer electronics brands.",
    assignedCreators: 0,
    assignedSponsors: 12,
    assignedContracts: 15,
    internalNotes: "Owns Samsung and Logitech accounts. Samsung deal in legal review.",
  },
  {
    id: "tm-007",
    name: "Noah Williams",
    email: "noah@playeroneiq.com",
    avatarInitials: "NW",
    avatarColor: "from-indigo-500 to-blue-600",
    role: "Editor",
    department: "Content",
    status: "active",
    lastLogin: "Jun 8, 2026 · 1:20 PM",
    joinedDate: "Apr 2024",
    phone: "+1 (512) 555-0106",
    bio: "Content Editor. Reviews deliverables, manages asset libraries, and QA checks.",
    assignedCreators: 0,
    assignedSponsors: 0,
    assignedContracts: 22,
    internalNotes: "Fast turnaround on deliverable reviews. Flagged for promotion in Q3.",
  },
  {
    id: "tm-008",
    name: "Isabella Moore",
    email: "isabella@playeroneiq.com",
    avatarInitials: "IM",
    avatarColor: "from-purple-500 to-violet-600",
    role: "Editor",
    department: "Content",
    status: "active",
    lastLogin: "Jun 5, 2026 · 3:10 PM",
    joinedDate: "Jan 2025",
    phone: "+1 (512) 555-0107",
    bio: "Junior Content Editor supporting campaign content and social asset creation.",
    assignedCreators: 0,
    assignedSponsors: 0,
    assignedContracts: 14,
    internalNotes: "Part-time contractor converting to full-time in July.",
  },
  {
    id: "tm-009",
    name: "James Okonkwo",
    email: "james@playeroneiq.com",
    avatarInitials: "JO",
    avatarColor: "from-slate-500 to-slate-600",
    role: "Viewer",
    department: "Analytics",
    status: "active",
    lastLogin: "Jun 4, 2026 · 10:00 AM",
    joinedDate: "Mar 2025",
    phone: "+1 (646) 555-0108",
    bio: "Analytics specialist with read-only access for reporting and data analysis.",
    assignedCreators: 0,
    assignedSponsors: 0,
    assignedContracts: 0,
    internalNotes: "External analytics consultant. Read-only access by design.",
  },
  {
    id: "tm-010",
    name: "Emily Foster",
    email: "emily.foster@playeroneiq.com",
    avatarInitials: "EF",
    avatarColor: "from-cyan-500 to-blue-500",
    role: "Talent Manager",
    department: "Talent",
    status: "pending",
    lastLogin: "—",
    joinedDate: "Jun 2026",
    phone: "+1 (310) 555-0109",
    bio: "Incoming Talent Manager — invite sent, awaiting account activation.",
    assignedCreators: 0,
    assignedSponsors: 0,
    assignedContracts: 0,
    internalNotes: "Invite sent Jun 5. Follow up if not activated by Jun 12.",
  },
  {
    id: "tm-011",
    name: "Ryan Mitchell",
    email: "ryan@playeroneiq.com",
    avatarInitials: "RM",
    avatarColor: "from-gray-600 to-gray-800",
    role: "Sponsorship Manager",
    department: "Partnerships",
    status: "inactive",
    lastLogin: "Apr 15, 2026 · 2:00 PM",
    joinedDate: "Aug 2023",
    phone: "+1 (212) 555-0110",
    bio: "Former Sponsorship Manager — departed April 2026. Account deactivated.",
    assignedCreators: 0,
    assignedSponsors: 0,
    assignedContracts: 0,
    internalNotes: "Offboarded Apr 2026. Accounts reassigned to Lucas Bennett.",
  },
];

export const activityLog: ActivityLogEntry[] = [
  {
    id: "log-001",
    userId: "tm-002",
    userName: "Mia Rodriguez",
    action: "Updated contract",
    target: "Air Max Gaming Collection",
    timestamp: "Jun 8, 2026 · 2:10 PM",
    type: "update",
  },
  {
    id: "log-002",
    userId: "tm-003",
    userName: "Ethan Park",
    action: "Added creator note",
    target: "@CreatorMike",
    timestamp: "Jun 8, 2026 · 1:45 PM",
    type: "update",
  },
  {
    id: "log-003",
    userId: "tm-005",
    userName: "Lucas Bennett",
    action: "Created sponsor",
    target: "Monster Energy",
    timestamp: "Jun 8, 2026 · 11:30 AM",
    type: "create",
  },
  {
    id: "log-004",
    userId: "tm-001",
    userName: "Jordan Hayes",
    action: "Signed in",
    target: "Player One IQ",
    timestamp: "Jun 8, 2026 · 9:00 AM",
    type: "login",
  },
  {
    id: "log-005",
    userId: "tm-002",
    userName: "Mia Rodriguez",
    action: "Invited team member",
    target: "Emily Foster",
    timestamp: "Jun 5, 2026 · 3:20 PM",
    type: "invite",
  },
  {
    id: "log-006",
    userId: "tm-001",
    userName: "Jordan Hayes",
    action: "Changed role permissions",
    target: "Editor → Content module",
    timestamp: "Jun 4, 2026 · 4:00 PM",
    type: "permission",
  },
  {
    id: "log-007",
    userId: "tm-006",
    userName: "Sophie Chen",
    action: "Updated sponsor",
    target: "Samsung",
    timestamp: "Jun 4, 2026 · 2:15 PM",
    type: "update",
  },
  {
    id: "log-008",
    userId: "tm-007",
    userName: "Noah Williams",
    action: "Marked deliverable complete",
    target: "Nike × @CreatorMike — Review Video",
    timestamp: "Jun 3, 2026 · 5:30 PM",
    type: "update",
  },
  {
    id: "log-009",
    userId: "tm-004",
    userName: "Ava Thompson",
    action: "Created creator profile",
    target: "@TechVibes",
    timestamp: "Jun 2, 2026 · 10:00 AM",
    type: "create",
  },
  {
    id: "log-010",
    userId: "tm-002",
    userName: "Mia Rodriguez",
    action: "Deactivated member",
    target: "Ryan Mitchell",
    timestamp: "Apr 15, 2026 · 11:00 AM",
    type: "delete",
  },
];

export function getTeamMemberById(id: string): TeamMember | undefined {
  return teamMembers.find((m) => m.id === id);
}

export function getTeamStats() {
  const active = teamMembers.filter((m) => m.status === "active");
  const pending = teamMembers.filter((m) => m.status === "pending");
  const uniqueRoles = new Set(teamMembers.map((m) => m.role));

  return {
    total: teamMembers.length,
    activeCount: active.length,
    pendingCount: pending.length,
    assignedRolesCount: uniqueRoles.size,
  };
}

export function getRoleColor(role: TeamRole): string {
  const colors: Record<TeamRole, string> = {
    "Organization Owner": "bg-violet-500/10 text-violet-400 ring-violet-500/20",
    Admin: "bg-purple-500/10 text-purple-400 ring-purple-500/20",
    "Talent Manager": "bg-blue-500/10 text-blue-400 ring-blue-500/20",
    "Sponsorship Manager": "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    Editor: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
    Viewer: "bg-gray-500/10 text-gray-400 ring-gray-500/20",
  };
  return colors[role];
}
