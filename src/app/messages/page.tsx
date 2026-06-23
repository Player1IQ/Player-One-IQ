import { DashboardLayout } from "@/components/DashboardLayout";
import { SubscriptionPageGate } from "@/components/subscription/SubscriptionPageGate";
import { MessagesInboxClient } from "@/components/messages/MessagesInboxClient";
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

export default async function MessagesPage() {
  const membership = await getCurrentUserMembership();

  if (isCreatorPortalRole(membership?.role ?? null) && membership?.linkedCreatorId) {
    await syncPortalUserToContractDealRooms(membership.linkedCreatorId);
  } else if (
    isSponsorPortalRole(membership?.role ?? null) &&
    membership?.linkedSponsorId
  ) {
    await syncPortalUserToSponsorDealRooms(membership.linkedSponsorId);
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

  return (
    <DashboardLayout
      title="Messages"
      description={
        isPortalUser
          ? "Messages with your agency team and contract deal rooms"
          : "Inbox, deal rooms, and team conversations"
      }
    >
      <SubscriptionPageGate required="messaging" featureLabel="Messaging">
        {currentUserId ? (
          <MessagesInboxClient
            conversations={conversations}
            users={messageUsers}
            currentUserId={currentUserId}
            isPortalUser={isPortalUser}
          />
        ) : (
          <p className="text-sm text-gray-500">Sign in to view messages.</p>
        )}
      </SubscriptionPageGate>
    </DashboardLayout>
  );
}
