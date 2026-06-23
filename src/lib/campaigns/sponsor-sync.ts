import { getCurrentUserMembership } from "@/lib/permissions";
import { isSponsorPortalRole } from "@/lib/team";

/** Returns linked sponsor id for sponsor portal users, undefined for everyone else. */
export async function getPortalSponsorFilter(): Promise<string | undefined | null> {
  const membership = await getCurrentUserMembership();
  if (!membership || !isSponsorPortalRole(membership.role)) return undefined;
  return membership.linkedSponsorId;
}
