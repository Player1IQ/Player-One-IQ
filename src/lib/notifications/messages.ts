import { after } from "next/server";
import { sendTransactionalEmail } from "@/lib/email/send";
import { getConfiguredAppUrl } from "@/lib/email/app-url";
import { createServiceClient } from "@/lib/supabase/admin";
import {
  claimEmailSend,
  getNotificationPreferencesForUser,
  preferenceAllowsKind,
  recentlySentEmail,
  releaseEmailSend,
} from "./store";
import { buildDeadlineEmail } from "./templates";
import { MESSAGE_EMAIL_DEBOUNCE_MS } from "./types";

export function scheduleNewMessageEmails(params: {
  organizationId: string;
  conversationId: string;
  senderId: string;
  preview: string;
}): void {
  after(() => notifyNewMessageEmails(params));
}

async function notifyNewMessageEmails(params: {
  organizationId: string;
  conversationId: string;
  senderId: string;
  preview: string;
}): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  const { data: participants } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", params.conversationId);

  const recipientIds = (participants ?? [])
    .map((row) => row.user_id as string | null)
    .filter((id): id is string => Boolean(id) && id !== params.senderId);

  if (recipientIds.length === 0) return;

  const { data: members } = await supabase
    .from("team_members")
    .select("user_id, organization_id, email, role, status")
    .eq("organization_id", params.organizationId)
    .in("user_id", recipientIds)
    .eq("status", "active");

  const { data: sender } = await supabase
    .from("team_members")
    .select("email, role")
    .eq("organization_id", params.organizationId)
    .eq("user_id", params.senderId)
    .maybeSingle();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("title")
    .eq("id", params.conversationId)
    .maybeSingle();

  const origin = getConfiguredAppUrl();
  const senderLabel = sender?.email ?? "A teammate";
  const title = conversation?.title?.trim() || "a conversation";
  const preview =
    params.preview.length > 180
      ? `${params.preview.slice(0, 180)}…`
      : params.preview;

  for (const member of members ?? []) {
    if (!member.user_id || !member.email) continue;

    const prefs = await getNotificationPreferencesForUser(
      supabase,
      member.user_id,
      params.organizationId
    );
    if (!preferenceAllowsKind(prefs, "message")) continue;

    const recent = await recentlySentEmail(
      supabase,
      member.user_id,
      "message",
      params.conversationId,
      MESSAGE_EMAIL_DEBOUNCE_MS
    );
    if (recent) continue;

    const recipient = {
      userId: member.user_id,
      organizationId: params.organizationId,
      email: member.email,
    };
    const windowKey = String(Math.floor(Date.now() / MESSAGE_EMAIL_DEBOUNCE_MS));
    const claimed = await claimEmailSend(
      supabase,
      recipient,
      "message",
      params.conversationId,
      windowKey
    );
    if (!claimed) continue;

    const isPortalUser =
      member.role === "player" ||
      member.role === "content_creator" ||
      member.role === "sponsor";
    const email = buildDeadlineEmail({
      heading: "New message",
      subject: `New message in ${title}`,
      lines: [`${senderLabel} wrote:`, preview],
      actionUrl: `${origin}/messages/${params.conversationId}`,
      actionLabel: "Open conversation",
      isPortalUser,
    });

    const result = await sendTransactionalEmail({
      to: member.email,
      ...email,
    });
    if (!result.sent) {
      await releaseEmailSend(
        supabase,
        recipient,
        "message",
        params.conversationId,
        windowKey
      );
    }
  }
}
