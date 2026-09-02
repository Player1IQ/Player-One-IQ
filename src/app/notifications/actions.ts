"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import {
  defaultNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/notifications/types";
import { mapPreferenceRow } from "@/lib/notifications/store";

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
      "email_deal_deadlines, email_new_opportunities, email_new_messages"
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
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organization_id,user_id" }
  );

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/portal/account");
  return { success: true };
}
