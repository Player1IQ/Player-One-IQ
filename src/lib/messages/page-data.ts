import {
  syncPortalUserToContractDealRooms,
  syncPortalUserToSponsorDealRooms,
} from "@/app/messages/actions";
import {
  getConversations,
  getCurrentUserId,
  getOrganizationUsers,
} from "@/lib/messages/queries";
import { getCurrentUserMembership } from "@/lib/permissions";
import {
  isCreatorPortalRole,
  isPortalRole,
  isSponsorPortalRole,
  staffRoles,
  type TeamRole,
} from "@/lib/team";

export async function loadMessagesPage() {
  const membership = await getCurrentUserMembership();

  if (isCreatorPortalRole(membership?.role ?? null) && membership?.linkedCreatorId) {
    void syncPortalUserToContractDealRooms(membership.linkedCreatorId, undefined, {
      revalidate: false,
    });
  } else if (
    isSponsorPortalRole(membership?.role ?? null) &&
    membership?.linkedSponsorId
  ) {
    void syncPortalUserToSponsorDealRooms(membership.linkedSponsorId, undefined, {
      revalidate: false,
    });
  }

  const [conversations, users, currentUserId] = await Promise.all([
    getConversations(),
    getOrganizationUsers(),
    getCurrentUserId(),
  ]);

  const isPortalUser = membership ? isPortalRole(membership.role) : false;
  const messageUsers = isPortalUser
    ? users.filter((user) => staffRoles.includes(user.role as TeamRole))
    : users;

  return {
    conversations,
    messageUsers,
    currentUserId,
    isPortalUser,
  };
}
