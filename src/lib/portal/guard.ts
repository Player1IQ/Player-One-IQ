import { STAFF_DASHBOARD_PATH } from "@/lib/routes";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUserMembership } from "@/lib/permissions";
import {
  getPortalRedirectPath,
  isPathAllowedForPortalUser,
  PORTAL_HOME,
  type PortalPathContext,
} from "@/lib/portal/paths";
import {
  isCreatorPortalRole,
  isPortalRole,
  isSponsorPortalRole,
} from "@/lib/team";

function getPortalPathContext(
  membership: NonNullable<Awaited<ReturnType<typeof getCurrentUserMembership>>>
): PortalPathContext {
  return {
    linkedCreatorId: membership.linkedCreatorId,
    linkedSponsorId: membership.linkedSponsorId,
  };
}

export async function enforcePortalRouteAccess(): Promise<void> {
  const membership = await getCurrentUserMembership();
  if (!membership || !isPortalRole(membership.role)) return;

  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";

  if (
    !pathname ||
    isPathAllowedForPortalUser(pathname, membership.role, getPortalPathContext(membership))
  ) {
    return;
  }

  redirect(getPortalRedirectPath(pathname, getPortalPathContext(membership)));
}

export async function requireCreatorPortalUser(): Promise<{
  role: "player" | "content_creator";
  linkedCreatorId: string;
}> {
  const membership = await getCurrentUserMembership();

  if (!membership || !isCreatorPortalRole(membership.role)) {
    redirect(STAFF_DASHBOARD_PATH);
  }

  if (!membership.linkedCreatorId) {
    redirect(PORTAL_HOME);
  }

  return {
    role: membership.role as "player" | "content_creator",
    linkedCreatorId: membership.linkedCreatorId,
  };
}

export async function requireSponsorPortalUser(): Promise<{
  linkedSponsorId: string;
}> {
  const membership = await getCurrentUserMembership();

  if (!membership || !isSponsorPortalRole(membership.role)) {
    redirect(STAFF_DASHBOARD_PATH);
  }

  if (!membership.linkedSponsorId) {
    redirect(PORTAL_HOME);
  }

  return { linkedSponsorId: membership.linkedSponsorId };
}

/** @deprecated Use requireCreatorPortalUser for creator portal pages. */
export async function requirePortalUser(): Promise<{
  role: "player" | "content_creator";
  linkedCreatorId: string;
}> {
  return requireCreatorPortalUser();
}
