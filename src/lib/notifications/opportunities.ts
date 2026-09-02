import type { SupabaseClient } from "@supabase/supabase-js";
import { after } from "next/server";
import { sendTransactionalEmail } from "@/lib/email/send";
import { getConfiguredAppUrl } from "@/lib/email/app-url";
import { mapCreatorRow, type Creator, type CreatorRow } from "@/lib/creators/types";
import {
  mapOpportunityRow,
  type Opportunity,
  type OpportunityRow,
} from "@/lib/opportunities/types";
import { creatorMatchesOpportunity } from "@/lib/opportunities/recommendations";
import {
  claimEmailSend,
  getNotificationPreferencesForUser,
  preferenceAllowsKind,
  releaseEmailSend,
  toRecipient,
  uniqueRecipients,
} from "./store";
import { buildDeadlineEmail } from "./templates";
import type { NotificationRecipient } from "./types";

async function loadCreator(
  supabase: SupabaseClient,
  creatorId: string
): Promise<Creator | null> {
  const { data } = await supabase
    .from("creators")
    .select("*")
    .eq("id", creatorId)
    .maybeSingle();
  if (!data) return null;
  return mapCreatorRow(data as CreatorRow);
}

async function sendOpportunityEmail(
  supabase: SupabaseClient,
  recipient: NotificationRecipient,
  opportunity: Opportunity,
  windowKey: string
): Promise<boolean> {
  const prefs = await getNotificationPreferencesForUser(
    supabase,
    recipient.userId,
    recipient.organizationId
  );
  if (!preferenceAllowsKind(prefs, "opportunity")) return false;

  const claimed = await claimEmailSend(
    supabase,
    recipient,
    "opportunity",
    opportunity.id,
    windowKey
  );
  if (!claimed) return false;

  const origin = getConfiguredAppUrl();
  const email = buildDeadlineEmail({
    heading: "New opportunity that fits your profile",
    subject: `New opportunity: ${opportunity.title}`,
    lines: [
      opportunity.title,
      opportunity.sponsorName ? `Sponsor: ${opportunity.sponsorName}` : "",
      `Platform: ${opportunity.platform}`,
      opportunity.budgetDisplay ? `Budget: ${opportunity.budgetDisplay}` : "",
    ].filter(Boolean),
    actionUrl: `${origin}/opportunities/${opportunity.id}`,
    actionLabel: "View opportunity",
    isPortalUser: true,
  });

  const result = await sendTransactionalEmail({
    to: recipient.email,
    ...email,
  });
  if (!result.sent) {
    await releaseEmailSend(
      supabase,
      recipient,
      "opportunity",
      opportunity.id,
      windowKey
    );
    return false;
  }
  return true;
}

async function matchingCreatorRecipients(
  supabase: SupabaseClient,
  opportunity: Opportunity,
  organizationIds: string[] | "all-except-source"
): Promise<NotificationRecipient[]> {
  let query = supabase
    .from("team_members")
    .select(
      "user_id, organization_id, email, role, linked_creator_id, linked_sponsor_id, status"
    )
    .eq("status", "active")
    .in("role", ["player", "content_creator"])
    .not("linked_creator_id", "is", null)
    .not("user_id", "is", null);

  if (organizationIds === "all-except-source") {
    query = query.neq("organization_id", opportunity.organizationId);
  } else {
    query = query.in("organization_id", organizationIds);
  }

  const { data: members } = await query;
  const recipients: NotificationRecipient[] = [];

  for (const member of members ?? []) {
    const recipient = toRecipient(member);
    if (!recipient || !member.linked_creator_id) continue;
    const creator = await loadCreator(supabase, member.linked_creator_id);
    if (!creator) continue;
    if (!creatorMatchesOpportunity(opportunity, creator)) continue;
    recipients.push(recipient);
  }

  return uniqueRecipients(recipients);
}

export async function notifySameOrgOpportunityMatches(
  supabase: SupabaseClient,
  opportunity: Opportunity
): Promise<void> {
  if (opportunity.status !== "open") return;

  const recipients = await matchingCreatorRecipients(supabase, opportunity, [
    opportunity.organizationId,
  ]);
  for (const recipient of recipients) {
    await sendOpportunityEmail(supabase, recipient, opportunity, "open");
  }
}

export function scheduleSameOrgOpportunityEmails(opportunity: Opportunity): void {
  if (opportunity.status !== "open") return;
  after(async () => {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    if (!supabase) return;
    await notifySameOrgOpportunityMatches(supabase, opportunity);
  });
}

export async function sendMarketplaceOpportunityDigest(
  supabase: SupabaseClient,
  sinceIso: string
): Promise<{ sent: number; skipped: number }> {
  const { data } = await supabase
    .from("opportunities")
    .select("*, sponsors ( company_name )")
    .eq("status", "open")
    .eq("marketplace_listing", true)
    .gte("created_at", sinceIso);

  let sent = 0;
  let skipped = 0;
  const rows = (data ?? []) as OpportunityRow[];

  for (const row of rows) {
    const opportunity = mapOpportunityRow(row);
    const recipients = await matchingCreatorRecipients(
      supabase,
      opportunity,
      "all-except-source"
    );
    for (const recipient of recipients.slice(0, 100)) {
      const didSend = await sendOpportunityEmail(
        supabase,
        recipient,
        opportunity,
        "marketplace"
      );
      if (didSend) sent += 1;
      else skipped += 1;
    }
  }

  return { sent, skipped };
}
