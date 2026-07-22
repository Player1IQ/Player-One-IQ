import { STAFF_DASHBOARD_PATH } from "@/lib/routes";
import {
  hasReadAccess,
  isPortalRole,
  permissionMatrix,
  type PermissionKey,
  type TeamRole,
} from "@/lib/team";

/** Nav href → permission key (list routes only). */
export const staffNavPermissionKeys: Partial<Record<string, PermissionKey>> = {
  "/creators": "creators",
  "/sponsors": "sponsors",
  "/campaigns": "campaigns",
  "/contracts": "contracts",
  "/opportunities": "opportunities",
  "/messages": "messages",
  "/schedule": "team",
  "/team": "team",
  "/billing": "billing",
  "/settings": "settings",
  "/ai": "ai",
  "/reports": "reports",
};

type StaffRouteGuard = {
  prefix: string;
  key: PermissionKey;
  /** Matches canViewBilling / canViewSettings in permissions.ts */
  access?: "billing" | "settings";
};

/** Longest prefixes first so nested routes resolve correctly. */
const STAFF_ROUTE_GUARDS: StaffRouteGuard[] = [
  { prefix: "/opportunities/applications", key: "opportunities" },
  { prefix: "/team/permissions", key: "team" },
  { prefix: "/creators", key: "creators" },
  { prefix: "/sponsors", key: "sponsors" },
  { prefix: "/campaigns", key: "campaigns" },
  { prefix: "/contracts", key: "contracts" },
  { prefix: "/opportunities", key: "opportunities" },
  { prefix: "/messages", key: "messages" },
  { prefix: "/schedule", key: "team" },
  { prefix: "/team", key: "team" },
  { prefix: "/billing", key: "billing", access: "billing" },
  { prefix: "/settings", key: "settings", access: "settings" },
  { prefix: "/reports", key: "reports" },
  { prefix: "/ai", key: "ai" },
];

const STAFF_UNGUARDED_PREFIXES = ["/portal"];

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Resolve a staff pathname to its permission guard, if any. */
export function getStaffRouteGuard(pathname: string): StaffRouteGuard | null {
  if (pathname === STAFF_DASHBOARD_PATH) return null;

  if (STAFF_UNGUARDED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    return null;
  }

  for (const guard of STAFF_ROUTE_GUARDS) {
    if (matchesPrefix(pathname, guard.prefix)) {
      return guard;
    }
  }

  return null;
}

function canViewBilling(role: TeamRole): boolean {
  return permissionMatrix[role].billing !== "none";
}

function canViewSettings(role: TeamRole): boolean {
  return permissionMatrix[role].settings !== "none";
}

/**
 * Defense-in-depth route guard for staff dashboard users.
 * Portal roles always return true (handled by portal guards in middleware).
 * Unknown paths default to allowed (API routes, invites, org setup, etc.).
 */
export function isPathAllowedForStaffUser(
  pathname: string,
  role: TeamRole
): boolean {
  if (isPortalRole(role)) return true;

  const guard = getStaffRouteGuard(pathname);
  if (!guard) return true;

  if (guard.access === "billing") return canViewBilling(role);
  if (guard.access === "settings") return canViewSettings(role);
  return hasReadAccess(role, guard.key);
}
