import { DashboardLayout } from "@/components/DashboardLayout";
import { SubscriptionPageGate } from "@/components/subscription/SubscriptionPageGate";
import { MessagesInboxClient } from "@/components/messages/MessagesInboxClient";
import { loadMessagesPage } from "@/lib/messages/page-data";

interface PortalMessagesPageProps {
  searchParams: Promise<{ create?: string }>;
}

export default async function PortalMessagesPage({
  searchParams,
}: PortalMessagesPageProps) {
  const { create } = await searchParams;
  const { conversations, messageUsers, currentUserId, isPortalUser } =
    await loadMessagesPage();

  return (
    <DashboardLayout
      title="Messages"
      description="Messages with your agency team and contract deal rooms"
    >
      <SubscriptionPageGate required="messaging" featureLabel="Messaging">
        {currentUserId ? (
          <MessagesInboxClient
            conversations={conversations}
            users={messageUsers}
            currentUserId={currentUserId}
            isPortalUser={isPortalUser}
            initialCreateOpen={create === "true"}
          />
        ) : (
          <p className="text-sm text-gray-500">Sign in to view messages.</p>
        )}
      </SubscriptionPageGate>
    </DashboardLayout>
  );
}
