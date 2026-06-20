import type { TeamRole } from "@/lib/team";
import { isPortalRole } from "@/lib/team";

export const PORTAL_HOME = "/portal";

const STAFF_ONLY_PREFIXES = [
  "/sponsors",
  "/team",
  "/billing",
  "/ai",
  "/reports",
  "/organization-setup",
  "/settings",
];

const SHARED_PREFIXES = ["/messages", "/contracts", "/portal"];

export function isPortalUser(role: TeamRole | null | undefined): boolean {
  return Boolean(role && isPortalRole(role));
}

export function isPathAllowedForPortalUser(
  pathname: string,
  role: TeamRole,
  linkedCreatorId: string | null
): boolean {
  if (!isPortalRole(role)) return true;

  if (pathname === "/" || pathname === "/creators") {
    return false;
  }

  if (STAFF_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return false;
  }

  if (role === "player" && pathname.startsWith("/campaigns")) {
    return false;
  }

  if (pathname.startsWith("/creators/")) {
    const creatorId = pathname.split("/")[2];
    return Boolean(linkedCreatorId && creatorId === linkedCreatorId);
  }

  if (
    SHARED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return true;
  }

  if (role === "content_creator" && pathname.startsWith("/campaigns")) {
    return true;
  }

  if (role === "content_creator" && pathname.startsWith("/opportunities")) {
    return true;
  }

  if (role === "player" && pathname.startsWith("/opportunities")) {
    return false;
  }

  return pathname === PORTAL_HOME || pathname.startsWith(`${PORTAL_HOME}/`);
}

export function getPortalRedirectPath(
  pathname: string,
  linkedCreatorId: string | null
): string {
  if (pathname.startsWith("/creators/") && linkedCreatorId) {
    return `/creators/${linkedCreatorId}`;
  }

  return PORTAL_HOME;
}
