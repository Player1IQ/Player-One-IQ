"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import {
  defaultNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/notifications/types";
import { mapPreferenceRow } from "@/lib/notifications/store";
import { sendTestWeeklyBrief } from "@/lib/notifications/weekly-brief";
import { createServiceClient } from "@/lib/supabase/admin";
import { getCurrentUserMembership } from "@/lib/permissions";
import { getCreatorById } from "@/lib/creators/queries";
import { resolveLocale } from "@/lib/i18n/locale";

export async function getMyNotificationPreferences(): Promise<NotificationPreferences> {
  const supabase = await createClient();
  if (!supabase) return { ...defaultNotificationPreferences };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ...defaultNotificationPreferences };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { ...defaultNotificationPreferences };

  const { data } = await supabase
    .from("notification_preferences")
    .select(
      "email_deal_deadlines, email_new_opportunities, email_new_messages, email_weekly_brief"
    )
    .eq("user_id", user.id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  return mapPreferenceRow(data);
}

export async function saveMyNotificationPreferences(
  input: NotificationPreferences
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { error } = await supabase.from("notification_preferences").upsert(
    {
      organization_id: organizationId,
      user_id: user.id,
      email_deal_deadlines: input.emailDealDeadlines,
      email_new_opportunities: input.emailNewOpportunities,
      email_new_messages: input.emailNewMessages,
      email_weekly_brief: input.emailWeeklyBrief,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organization_id,user_id" }
  );

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/portal/account");
  return { success: true };
}

export async function canSendWeeklyBriefTest(): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const membership = await getCurrentUserMembership();
  if (!membership) return false;
  if (membership.role === "owner" || membership.role === "admin") return true;

  const organizationId = await getOrganizationId();
  if (!organizationId) return false;
  const { data: organization } = await supabase
    .from("organizations")
    .select("user_id")
    .eq("id", organizationId)
    .maybeSingle();
  return organization?.user_id === user.id;
}

export async function sendTestWeeklyBriefToMe(): Promise<
  { success: true } | { error: string }
> {
  const allowed = await canSendWeeklyBriefTest();
  if (!allowed) {
    return { error: "Only an owner or admin can send a test weekly brief." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Not authenticated." };

  const membership = await getCurrentUserMembership();
  const organizationId = await getOrganizationId();
  if (!membership || !organizationId) {
    return { error: "Organization not found." };
  }
  if (!membership.linkedCreatorId) {
    return { error: "Link a creator to your membership to send a test brief." };
  }

  const creator = await getCreatorById(membership.linkedCreatorId);
  if (!creator) return { error: "Linked creator not found." };

  const service = createServiceClient();
  if (!service) return { error: "Service client is not configured." };

  const locale = await resolveLocale();
  const result = await sendTestWeeklyBrief({
    supabase: service,
    recipient: {
      userId: user.id,
      organizationId,
      email: user.email,
    },
    creatorId: creator.id,
    creatorName: creator.name,
    locale,
  });
  if (!result.sent) return { error: result.error };
  return { success: true };
}
