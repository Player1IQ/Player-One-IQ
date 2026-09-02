import type { SupabaseClient } from "@supabase/supabase-js";
import {
  defaultNotificationPreferences,
  type NotificationEmailKind,
  type NotificationPreferences,
  type NotificationRecipient,
} from "./types";

interface PreferenceRow {
  email_deal_deadlines: boolean;
  email_new_opportunities: boolean;
  email_new_messages: boolean;
}

export function mapPreferenceRow(row: PreferenceRow | null): NotificationPreferences {
  if (!row) return { ...defaultNotificationPreferences };
  return {
    emailDealDeadlines: row.email_deal_deadlines,
    emailNewOpportunities: row.email_new_opportunities,
    emailNewMessages: row.email_new_messages,
  };
}

export async function getNotificationPreferencesForUser(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string
): Promise<NotificationPreferences> {
  const { data } = await supabase
    .from("notification_preferences")
    .select(
      "email_deal_deadlines, email_new_opportunities, email_new_messages"
    )
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  return mapPreferenceRow(data);
}

export function preferenceAllowsKind(
  prefs: NotificationPreferences,
  kind: NotificationEmailKind
): boolean {
  if (kind === "message") return prefs.emailNewMessages;
  if (kind === "opportunity") return prefs.emailNewOpportunities;
  return prefs.emailDealDeadlines;
}

export async function claimEmailSend(
  supabase: SupabaseClient,
  recipient: NotificationRecipient,
  kind: NotificationEmailKind,
  entityId: string,
  windowKey: string
): Promise<boolean> {
  const { error } = await supabase.from("notification_email_log").insert({
    organization_id: recipient.organizationId,
    user_id: recipient.userId,
    kind,
    entity_id: entityId,
    window_key: windowKey,
  });

  if (!error) return true;
  if (error.code === "23505") return false;
  console.error("[notifications] failed to claim email send:", error.message);
  return false;
}

export async function releaseEmailSend(
  supabase: SupabaseClient,
  recipient: NotificationRecipient,
  kind: NotificationEmailKind,
  entityId: string,
  windowKey: string
): Promise<void> {
  const { error } = await supabase
    .from("notification_email_log")
    .delete()
    .eq("user_id", recipient.userId)
    .eq("kind", kind)
    .eq("entity_id", entityId)
    .eq("window_key", windowKey);

  if (error) {
    console.error("[notifications] failed to release email send:", error.message);
  }
}

export async function recentlySentEmail(
  supabase: SupabaseClient,
  userId: string,
  kind: NotificationEmailKind,
  entityId: string,
  withinMs: number
): Promise<boolean> {
  const since = new Date(Date.now() - withinMs).toISOString();
  const { data } = await supabase
    .from("notification_email_log")
    .select("id")
    .eq("user_id", userId)
    .eq("kind", kind)
    .eq("entity_id", entityId)
    .gte("sent_at", since)
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

interface TeamMemberEmailRow {
  user_id: string | null;
  organization_id: string;
  email: string;
  role: string;
  linked_creator_id: string | null;
  linked_sponsor_id: string | null;
  status: string;
}

export function toRecipient(row: TeamMemberEmailRow): NotificationRecipient | null {
  if (!row.user_id || !row.email || row.status !== "active") return null;
  return {
    userId: row.user_id,
    organizationId: row.organization_id,
    email: row.email,
  };
}

export async function loadOrgMembers(
  supabase: SupabaseClient,
  organizationId: string
): Promise<TeamMemberEmailRow[]> {
  const { data } = await supabase
    .from("team_members")
    .select(
      "user_id, organization_id, email, role, linked_creator_id, linked_sponsor_id, status"
    )
    .eq("organization_id", organizationId)
    .eq("status", "active");

  return (data ?? []) as TeamMemberEmailRow[];
}

export function uniqueRecipients(
  recipients: Array<NotificationRecipient | null>
): NotificationRecipient[] {
  const seen = new Set<string>();
  const result: NotificationRecipient[] = [];
  for (const recipient of recipients) {
    if (!recipient) continue;
    const key = `${recipient.organizationId}:${recipient.userId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(recipient);
  }
  return result;
}
