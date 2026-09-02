import type { SupabaseClient } from "@supabase/supabase-js";
import { sendTransactionalEmail } from "@/lib/email/send";
import { getConfiguredAppUrl } from "@/lib/email/app-url";
import {
  claimEmailSend,
  getNotificationPreferencesForUser,
  loadOrgMembers,
  preferenceAllowsKind,
  releaseEmailSend,
  toRecipient,
  uniqueRecipients,
} from "./store";
import { buildDeadlineEmail } from "./templates";
import { contractEndingWindow, deliverableDueWindowKeys } from "./dates";
import type { NotificationRecipient } from "./types";

const STAFF_DEADLINE_ROLES = new Set(["owner", "admin"]);

function isPortalRole(role: string): boolean {
  return role === "player" || role === "content_creator" || role === "sponsor";
}

async function sendIfAllowed(
  supabase: SupabaseClient,
  recipient: NotificationRecipient,
  kind: "deliverable_due" | "contract_ending",
  entityId: string,
  windowKey: string,
  email: { subject: string; text: string; html: string }
): Promise<boolean> {
  const prefs = await getNotificationPreferencesForUser(
    supabase,
    recipient.userId,
    recipient.organizationId
  );
  if (!preferenceAllowsKind(prefs, kind)) return false;
  const claimed = await claimEmailSend(
    supabase,
    recipient,
    kind,
    entityId,
    windowKey
  );
  if (!claimed) return false;

  const result = await sendTransactionalEmail({
    to: recipient.email,
    ...email,
  });
  if (!result.sent) {
    await releaseEmailSend(supabase, recipient, kind, entityId, windowKey);
    return false;
  }
  return true;
}

export async function sendDeadlineEmails(
  supabase: SupabaseClient,
  now = new Date()
): Promise<{ sent: number; skipped: number }> {
  let sent = 0;
  let skipped = 0;
  const origin = getConfiguredAppUrl();

  const dueWindows = deliverableDueWindowKeys(now);
  for (const window of dueWindows) {
    const { data: deliverables } = await supabase
      .from("contract_deliverables")
      .select("id, organization_id, contract_id, title, due_date, status")
      .neq("status", "completed")
      .eq("due_date", window.dueDate);

    for (const deliverable of deliverables ?? []) {
      const { data: contract } = await supabase
        .from("contracts")
        .select("id, contract_name, creator_id, sponsor_id, contract_status")
        .eq("id", deliverable.contract_id)
        .maybeSingle();
      if (!contract || contract.contract_status === "cancelled") {
        skipped += 1;
        continue;
      }

      const members = await loadOrgMembers(supabase, deliverable.organization_id);
      const recipients = uniqueRecipients(
        members.map((member) => {
          const recipient = toRecipient(member);
          if (!recipient) return null;
          const isCreator =
            member.linked_creator_id === contract.creator_id &&
            (member.role === "player" || member.role === "content_creator");
          const isSponsor =
            member.linked_sponsor_id === contract.sponsor_id &&
            member.role === "sponsor";
          const isStaff = STAFF_DEADLINE_ROLES.has(member.role);
          if (!isCreator && !isSponsor && !isStaff) return null;
          return recipient;
        })
      );

      const daysLabel = window.windowKey === "due-1d" ? "tomorrow" : "in 3 days";
      for (const recipient of recipients) {
        const member = members.find((row) => row.user_id === recipient.userId);
        const email = buildDeadlineEmail({
          heading: "Deliverable due soon",
          subject: `Deliverable due ${daysLabel}: ${deliverable.title}`,
          lines: [
            `"${deliverable.title}" is due ${daysLabel}.`,
            `Deal: ${contract.contract_name}`,
          ],
          actionUrl: `${origin}/contracts/${contract.id}`,
          actionLabel: "Open deal",
          isPortalUser: member ? isPortalRole(member.role) : false,
        });
        const didSend = await sendIfAllowed(
          supabase,
          recipient,
          "deliverable_due",
          deliverable.id,
          window.windowKey,
          email
        );
        if (didSend) sent += 1;
        else skipped += 1;
      }
    }
  }

  const ending = contractEndingWindow(now);
  const { data: contracts } = await supabase
    .from("contracts")
    .select("id, organization_id, contract_name, creator_id, sponsor_id, contract_status, end_date")
    .eq("contract_status", "active")
    .eq("end_date", ending.endDate);

  for (const contract of contracts ?? []) {
    const members = await loadOrgMembers(supabase, contract.organization_id);
    const recipients = uniqueRecipients(
      members.map((member) => {
        const recipient = toRecipient(member);
        if (!recipient) return null;
        const isCreator =
          member.linked_creator_id === contract.creator_id &&
          (member.role === "player" || member.role === "content_creator");
        const isSponsor =
          member.linked_sponsor_id === contract.sponsor_id &&
          member.role === "sponsor";
        const isStaff = STAFF_DEADLINE_ROLES.has(member.role);
        if (!isCreator && !isSponsor && !isStaff) return null;
        return recipient;
      })
    );

    for (const recipient of recipients) {
      const member = members.find((row) => row.user_id === recipient.userId);
      const email = buildDeadlineEmail({
        heading: "Deal ending soon",
        subject: `Deal ends in 7 days: ${contract.contract_name}`,
        lines: [
          `"${contract.contract_name}" is scheduled to end in 7 days.`,
          "Review renewals or wrap up remaining deliverables.",
        ],
        actionUrl: `${origin}/contracts/${contract.id}`,
        actionLabel: "Open deal",
        isPortalUser: member ? isPortalRole(member.role) : false,
      });
      const didSend = await sendIfAllowed(
        supabase,
        recipient,
        "contract_ending",
        contract.id,
        ending.windowKey,
        email
      );
      if (didSend) sent += 1;
      else skipped += 1;
    }
  }

  return { sent, skipped };
}
