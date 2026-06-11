import { DashboardLayout } from "@/components/DashboardLayout";
import { SubscriptionPageGate } from "@/components/subscription/SubscriptionPageGate";
import { MessagesInboxClient } from "@/components/messages/MessagesInboxClient";
import {
  getConversations,
  getCurrentUserId,
  getOrganizationUsers,
} from "@/lib/messages/queries";

export default async function MessagesPage() {
  const [conversations, users, currentUserId] = await Promise.all([
    getConversations(),
    getOrganizationUsers(),
    getCurrentUserId(),
  ]);

  return (
    <DashboardLayout
      title="Messages"
      description="Inbox, deal rooms, and team conversations"
    >
      <SubscriptionPageGate required="messaging" featureLabel="Messaging">
        {currentUserId ? (
          <MessagesInboxClient
            conversations={conversations}
            users={users}
            currentUserId={currentUserId}
          />
        ) : (
          <p className="text-sm text-gray-500">Sign in to view messages.</p>
        )}
      </SubscriptionPageGate>
    </DashboardLayout>
  );
}
