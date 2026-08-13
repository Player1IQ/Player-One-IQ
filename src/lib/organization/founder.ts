import { creatorPlayerOrgType } from "@/lib/organization/constants";
import type { TeamRole } from "@/lib/team";
import { isCreatorPortalRole } from "@/lib/team";

export function isSoloCreatorWorkspaceFounder(input: {
  organizationType: string | null | undefined;
  organizationUserId: string | null | undefined;
  currentUserId: string | null | undefined;
  role: TeamRole | null | undefined;
}): boolean {
  if (!input.currentUserId || !input.organizationUserId) return false;
  if (input.organizationUserId !== input.currentUserId) return false;
  if (input.organizationType !== creatorPlayerOrgType) return false;
  return Boolean(input.role && isCreatorPortalRole(input.role));
}
