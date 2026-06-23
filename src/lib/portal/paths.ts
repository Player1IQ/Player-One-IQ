import type { TeamRole } from "@/lib/team";
import {
  isCreatorPortalRole,
  isPortalRole,
  isSponsorPortalRole,
} from "@/lib/team";

export const PORTAL_HOME = "/portal";

export interface PortalPathContext {
  linkedCreatorId?: string | null;
  linkedSponsorId?: string | null;
}

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
  context: PortalPathContext | string | null = {}
): boolean {
  if (!isPortalRole(role)) return true;

  const linkedCreatorId =
    typeof context === "string" || context === null
      ? context
      : (context.linkedCreatorId ?? null);
  const linkedSponsorId =
    typeof context === "object" && context !== null
      ? (context.linkedSponsorId ?? null)
      : null;

  if (pathname === "/" || pathname === "/creators") {
    return false;
  }

  if (isSponsorPortalRole(role)) {
    if (pathname.startsWith("/creators") || pathname.startsWith("/opportunities")) {
      return false;
    }

    if (pathname === "/sponsors") {
      return false;
    }

    if (pathname.startsWith("/sponsors/")) {
      const sponsorId = pathname.split("/")[2];
      return Boolean(linkedSponsorId && sponsorId === linkedSponsorId);
    }

    if (pathname.startsWith("/campaigns")) {
      return true;
    }

    if (
      SHARED_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
      )
    ) {
      return true;
    }

    return pathname === PORTAL_HOME || pathname.startsWith(`${PORTAL_HOME}/`);
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

  if (isCreatorPortalRole(role) && pathname.startsWith("/campaigns")) {
    return true;
  }

  if (isCreatorPortalRole(role) && pathname.startsWith("/opportunities")) {
    return true;
  }

  if (role === "player" && pathname.startsWith("/opportunities")) {
    return false;
  }

  return pathname === PORTAL_HOME || pathname.startsWith(`${PORTAL_HOME}/`);
}

export function getPortalRedirectPath(
  pathname: string,
  context: PortalPathContext | string | null = {}
): string {
  const linkedCreatorId =
    typeof context === "string" || context === null
      ? context
      : (context.linkedCreatorId ?? null);
  const linkedSponsorId =
    typeof context === "object" && context !== null
      ? (context.linkedSponsorId ?? null)
      : null;

  if (pathname.startsWith("/creators/") && linkedCreatorId) {
    return `/creators/${linkedCreatorId}`;
  }

  if (pathname.startsWith("/sponsors/") && linkedSponsorId) {
    return `/sponsors/${linkedSponsorId}`;
  }

  return PORTAL_HOME;
}
