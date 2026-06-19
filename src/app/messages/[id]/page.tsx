import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ConversationClient } from "@/components/messages/ConversationClient";
import {
  getConversationById,
  getConversationParticipants,
  getMessages,
  getOrganizationUsers,
} from "@/lib/messages/queries";

interface ConversationPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { id } = await params;
  const [conversation, messages, participants, orgUsers] = await Promise.all([
    getConversationById(id),
    getMessages(id),
    getConversationParticipants(id),
    getOrganizationUsers(),
  ]);

  if (!conversation) notFound();

  const relatedHref =
    conversation.type === "opportunity" && conversation.relatedId
      ? `/opportunities/${conversation.relatedId}`
      : conversation.type === "contract" && conversation.relatedId
        ? `/contracts/${conversation.relatedId}`
        : null;

  return (
    <DashboardLayout
      title={conversation.title}
      description={conversation.subtitle}
    >
      <ConversationClient
        conversation={conversation}
        initialMessages={messages}
        participants={participants}
        orgUsers={orgUsers}
        relatedHref={relatedHref}
      />
    </DashboardLayout>
  );
}
