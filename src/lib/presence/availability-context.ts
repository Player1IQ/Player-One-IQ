"use server";

import { getCreatorById } from "@/lib/creators/queries";
import { getCurrentUserMembership } from "@/lib/permissions";
import { isCreatorPortalRole } from "@/lib/team";
import { getMyPresence } from "./queries";
import type { PresenceStatus } from "./types";

export type SidebarAvailabilityContext =
  | {
      mode: "creator";
      status: PresenceStatus;
      creatorId: string;
    }
  | {
      mode: "user";
      status: PresenceStatus;
    };

export async function getSidebarAvailabilityContext(): Promise<SidebarAvailabilityContext> {
  const membership = await getCurrentUserMembership();

  if (
    membership &&
    isCreatorPortalRole(membership.role) &&
    membership.linkedCreatorId
  ) {
    const creator = await getCreatorById(membership.linkedCreatorId);
    return {
      mode: "creator",
      status: creator?.availabilityStatus ?? "inactive",
      creatorId: membership.linkedCreatorId,
    };
  }

  const status = await getMyPresence();
  return { mode: "user", status };
}
