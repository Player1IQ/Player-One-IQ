import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUserMembership } from "@/lib/permissions";
import {
  getPortalRedirectPath,
  isPathAllowedForPortalUser,
  PORTAL_HOME,
} from "@/lib/portal/paths";
import { isPortalRole } from "@/lib/team";

export async function enforcePortalRouteAccess(): Promise<void> {
  const membership = await getCurrentUserMembership();
  if (!membership || !isPortalRole(membership.role)) return;

  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";

  if (!pathname || isPathAllowedForPortalUser(pathname, membership.role, membership.linkedCreatorId)) {
    return;
  }

  redirect(getPortalRedirectPath(pathname, membership.linkedCreatorId));
}

export async function requirePortalUser(): Promise<{
  role: "player" | "content_creator";
  linkedCreatorId: string;
}> {
  const membership = await getCurrentUserMembership();

  if (!membership || !isPortalRole(membership.role)) {
    redirect("/");
  }

  if (!membership.linkedCreatorId) {
    redirect(PORTAL_HOME);
  }

  return {
    role: membership.role as "player" | "content_creator",
    linkedCreatorId: membership.linkedCreatorId,
  };
}
