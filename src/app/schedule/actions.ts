"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAppOrigin } from "@/lib/email/app-url";
import { sendScheduleInviteEmail } from "@/lib/email/schedule-invite";
import { getOrganizationForUser, getOrganizationId } from "@/lib/organization/queries";
import { getCurrentUserMembership } from "@/lib/permissions";
import {
  scheduleEventTypes,
  type ScheduleBlockInput,
  type ScheduleEventInput,
  type ScheduleEventType,
} from "@/lib/schedule";
import {
  canManageOrgSchedule,
  getUnreadScheduleNotifications,
} from "@/lib/schedule/queries";

async function ensureAuthenticatedSession(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>
): Promise<{ error: string } | null> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    return {
      error:
        "Your session expired. Please sign out, sign in again, and retry.",
    };
  }

  return null;
}

function validateEventInput(input: ScheduleEventInput): string | null {
  if (!input.title.trim()) return "Title is required.";
  if (!scheduleEventTypes.includes(input.eventType)) return "Invalid event type.";
  if (!input.startsAt || !input.endsAt) return "Start and end times are required.";
  if (new Date(input.endsAt).getTime() <= new Date(input.startsAt).getTime()) {
    return "End time must be after start time.";
  }
  return null;
}

async function notifyParticipants(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  organizationId: string,
  eventId: string,
  title: string,
  startsAt: string,
  participantUserIds: string[]
) {
  if (participantUserIds.length === 0) return;

  await supabase.rpc("insert_schedule_notifications", {
    p_organization_id: organizationId,
    p_event_id: eventId,
    p_title: title,
    p_starts_at: startsAt,
    p_user_ids: participantUserIds,
  });
}

async function resolveCreatorUserIds(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  organizationId: string,
  creatorIds: string[]
): Promise<string[]> {
  if (creatorIds.length === 0) return [];

  const { data } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .in("linked_creator_id", creatorIds)
    .not("user_id", "is", null);

  return (data ?? [])
    .map((row) => row.user_id)
    .filter((id): id is string => Boolean(id));
}

async function resolveParticipantEmails(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  organizationId: string,
  userIds: string[],
  creatorIds: string[]
): Promise<string[]> {
  const emails = new Set<string>();

  if (userIds.length > 0) {
    const { data } = await supabase
      .from("team_members")
      .select("email")
      .eq("organization_id", organizationId)
      .in("user_id", userIds)
      .not("email", "is", null);

    for (const row of data ?? []) {
      if (row.email?.trim()) emails.add(row.email.trim().toLowerCase());
    }
  }

  if (creatorIds.length > 0) {
    const [{ data: creators }, { data: linkedMembers }] = await Promise.all([
      supabase
        .from("creators")
        .select("email")
        .eq("organization_id", organizationId)
        .in("id", creatorIds)
        .not("email", "is", null),
      supabase
        .from("team_members")
        .select("email")
        .eq("organization_id", organizationId)
        .eq("status", "active")
        .in("linked_creator_id", creatorIds)
        .not("email", "is", null),
    ]);

    for (const row of creators ?? []) {
      if (row.email?.trim()) emails.add(row.email.trim().toLowerCase());
    }
    for (const row of linkedMembers ?? []) {
      if (row.email?.trim()) emails.add(row.email.trim().toLowerCase());
    }
  }

  return Array.from(emails);
}

async function emailScheduleInvites(params: {
  organizationName: string;
  organizerEmail?: string | null;
  eventTitle: string;
  eventType: ScheduleEventInput["eventType"];
  startsAt: string;
  endsAt: string;
  allDay?: boolean;
  location?: string | null;
  recipientEmails: string[];
}) {
  if (params.recipientEmails.length === 0) return;

  const origin = await getAppOrigin();
  const scheduleUrl = `${origin}/schedule`;

  await Promise.all(
    params.recipientEmails.map((to) =>
      sendScheduleInviteEmail({
        to,
        scheduleUrl,
        organizationName: params.organizationName,
        eventTitle: params.eventTitle,
        eventType: params.eventType,
        startsAt: params.startsAt,
        endsAt: params.endsAt,
        allDay: params.allDay,
        location: params.location,
        organizerEmail: params.organizerEmail,
      })
    )
  );
}

export async function createScheduleEvent(input: ScheduleEventInput) {
  const canManage = await canManageOrgSchedule();
  if (!canManage) {
    return { error: "You do not have permission to create schedule events." };
  }

  const error = validateEventInput(input);
  if (error) return { error };

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const sessionError = await ensureAuthenticatedSession(supabase);
  if (sessionError) return sessionError;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: eventId, error: insertError } = await supabase.rpc(
    "create_org_schedule_event",
    {
      p_organization_id: organizationId,
      p_title: input.title.trim(),
      p_description: input.description?.trim() || null,
      p_event_type: input.eventType,
      p_starts_at: input.startsAt,
      p_ends_at: input.endsAt,
      p_all_day: input.allDay ?? false,
      p_location: input.location?.trim() || null,
      p_color: input.color ?? null,
    }
  );

  if (insertError || !eventId) {
    return { error: insertError?.message ?? "Failed to create event." };
  }

  const event = {
    id: eventId as string,
    title: input.title.trim(),
    starts_at: input.startsAt,
  };

  const userIds = Array.from(
    new Set(input.participantUserIds ?? []).values()
  ).filter((userId) => userId !== user.id);
  const creatorIds = input.participantCreatorIds ?? [];

  const { error: participantError } = await supabase.rpc(
    "sync_schedule_event_participants",
    {
      p_event_id: event.id,
      p_organization_id: organizationId,
      p_user_ids: userIds,
      p_creator_ids: creatorIds,
    }
  );

  if (participantError) {
    await supabase.rpc("delete_schedule_event", {
      p_event_id: event.id,
      p_organization_id: organizationId,
    });
    return { error: participantError.message };
  }

  const creatorUserIds = await resolveCreatorUserIds(
    supabase,
    organizationId,
    creatorIds
  );
  const notifyUserIds = [...userIds, ...creatorUserIds];

  await notifyParticipants(
    supabase,
    organizationId,
    event.id,
    event.title,
    event.starts_at,
    [...new Set(notifyUserIds)]
  );

  const organization = await getOrganizationForUser();
  const recipientEmails = await resolveParticipantEmails(
    supabase,
    organizationId,
    userIds,
    creatorIds
  );
  const organizerEmail = user.email?.toLowerCase();
  const filteredEmails = recipientEmails.filter(
    (email) => email !== organizerEmail
  );

  await emailScheduleInvites({
    organizationName: organization?.name ?? "Your organization",
    organizerEmail: user.email,
    eventTitle: input.title.trim(),
    eventType: input.eventType,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    allDay: input.allDay,
    location: input.location?.trim() || null,
    recipientEmails: filteredEmails,
  });

  revalidatePath("/schedule");
  revalidatePath("/");
  revalidatePath("/portal");
  return { id: event.id };
}

export async function createCreatorBlock(input: ScheduleBlockInput) {
  const membership = await getCurrentUserMembership();
  if (!membership?.linkedCreatorId) {
    return { error: "Only creators can block time on the portal calendar." };
  }

  if (!input.startsAt || !input.endsAt) {
    return { error: "Start and end times are required." };
  }
  if (new Date(input.endsAt).getTime() <= new Date(input.startsAt).getTime()) {
    return { error: "End time must be after start time." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const sessionError = await ensureAuthenticatedSession(supabase);
  if (sessionError) return sessionError;

  const title = input.title?.trim() || "Blocked";

  const { data: eventId, error: insertError } = await supabase.rpc(
    "create_creator_schedule_block",
    {
      p_organization_id: organizationId,
      p_title: title,
      p_starts_at: input.startsAt,
      p_ends_at: input.endsAt,
      p_all_day: input.allDay ?? false,
    }
  );

  if (insertError || !eventId) {
    return { error: insertError?.message ?? "Failed to block time." };
  }

  revalidatePath("/schedule");
  revalidatePath("/portal");
  return { id: eventId as string };
}

export async function updateCreatorBlock(id: string, input: ScheduleBlockInput) {
  const membership = await getCurrentUserMembership();
  if (!membership?.linkedCreatorId) {
    return { error: "Only creators can update blocked time." };
  }

  if (!input.startsAt || !input.endsAt) {
    return { error: "Start and end times are required." };
  }
  if (new Date(input.endsAt).getTime() <= new Date(input.startsAt).getTime()) {
    return { error: "End time must be after start time." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: existing, error: existingError } = await supabase
    .from("schedule_events")
    .select("id, event_type, created_by")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (existingError || !existing) {
    return { error: "Event not found." };
  }
  if (existing.event_type !== "block" || existing.created_by !== user.id) {
    return { error: "You can only edit your own blocked time." };
  }

  const sessionError = await ensureAuthenticatedSession(supabase);
  if (sessionError) return sessionError;

  const title = input.title?.trim() || "Blocked";

  const { error: updateError } = await supabase.rpc(
    "update_creator_schedule_block",
    {
      p_event_id: id,
      p_organization_id: organizationId,
      p_title: title,
      p_starts_at: input.startsAt,
      p_ends_at: input.endsAt,
      p_all_day: input.allDay ?? false,
    }
  );

  if (updateError) return { error: updateError.message };

  revalidatePath("/schedule");
  revalidatePath("/portal");
  return { id };
}

export async function updateScheduleEvent(
  id: string,
  input: ScheduleEventInput
) {
  const error = validateEventInput(input);
  if (error) return { error };

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const existing = await supabase
    .from("schedule_events")
    .select("id, event_type, created_by")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!existing.data) return { error: "Event not found." };

  const membership = await getCurrentUserMembership();
  const canManage = await canManageOrgSchedule();
  const isOwnBlock =
    existing.data.event_type === "block" &&
    Boolean(membership?.linkedCreatorId);

  if (!canManage && !isOwnBlock) {
    return { error: "You do not have permission to update this event." };
  }
  if (isOwnBlock && input.eventType !== "block") {
    return { error: "Portal users can only manage blocked time." };
  }

  const sessionError = await ensureAuthenticatedSession(supabase);
  if (sessionError) return sessionError;

  if (isOwnBlock) {
    return updateCreatorBlock(id, {
      title: input.title,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      allDay: input.allDay,
    });
  }

  const { error: updateError } = await supabase.rpc("update_org_schedule_event", {
    p_event_id: id,
    p_organization_id: organizationId,
    p_title: input.title.trim(),
    p_description: input.description?.trim() || null,
    p_event_type: input.eventType,
    p_starts_at: input.startsAt,
    p_ends_at: input.endsAt,
    p_all_day: input.allDay ?? false,
    p_location: input.location?.trim() || null,
    p_color: input.color ?? null,
  });

  if (updateError) return { error: updateError.message };

  const userIds = input.participantUserIds ?? [];
  const creatorIds = input.participantCreatorIds ?? [];

  const { error: participantError } = await supabase.rpc(
    "sync_schedule_event_participants",
    {
      p_event_id: id,
      p_organization_id: organizationId,
      p_user_ids: userIds,
      p_creator_ids: creatorIds,
    }
  );

  if (participantError) return { error: participantError.message };

  revalidatePath("/schedule");
  revalidatePath("/");
  revalidatePath("/portal");
  return { id };
}

export async function respondToScheduleInvite(
  participantId: string,
  response: "accepted" | "declined"
) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const sessionError = await ensureAuthenticatedSession(supabase);
  if (sessionError) return sessionError;

  const { error } = await supabase.rpc("respond_to_schedule_invite", {
    p_participant_id: participantId,
    p_response: response,
  });

  if (error) return { error: error.message };

  revalidatePath("/schedule");
  revalidatePath("/portal");
  return { success: true as const };
}

export async function deleteScheduleEvent(id: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { data: existing } = await supabase
    .from("schedule_events")
    .select("id, event_type, created_by")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!existing) return { error: "Event not found." };

  const canManage = await canManageOrgSchedule();
  const membership = await getCurrentUserMembership();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwnBlock =
    existing.event_type === "block" &&
    Boolean(membership?.linkedCreatorId) &&
    existing.created_by === user?.id;

  if (!canManage && !isOwnBlock) {
    return { error: "You do not have permission to delete this event." };
  }

  const sessionError = await ensureAuthenticatedSession(supabase);
  if (sessionError) return sessionError;

  const { error } = await supabase.rpc("delete_schedule_event", {
    p_event_id: id,
    p_organization_id: organizationId,
  });

  if (error) return { error: error.message };

  revalidatePath("/schedule");
  revalidatePath("/");
  revalidatePath("/portal");
  return { success: true };
}

export async function fetchUnreadScheduleNotifications() {
  return getUnreadScheduleNotifications();
}

export async function markScheduleNotificationRead(notificationId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export type ScheduleParticipantOption = {
  id: string;
  label: string;
  type: "user" | "creator";
};

export async function getScheduleParticipantOptions(): Promise<
  ScheduleParticipantOption[]
> {
  const canManage = await canManageOrgSchedule();
  if (!canManage) return [];

  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const [{ data: members }, { data: creators }] = await Promise.all([
    supabase
      .from("team_members")
      .select("user_id, role, linked_creator_id")
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .not("user_id", "is", null),
    supabase
      .from("creators")
      .select("id, name")
      .eq("organization_id", organizationId)
      .order("name"),
  ]);

  const options: ScheduleParticipantOption[] = [];

  for (const member of members ?? []) {
    if (!member.user_id) continue;
    if (member.role === "player" || member.role === "content_creator") continue;
    options.push({
      id: member.user_id,
      label: `Team member (${member.role})`,
      type: "user",
    });
  }

  for (const creator of creators ?? []) {
    options.push({
      id: creator.id,
      label: creator.name,
      type: "creator",
    });
  }

  return options;
}

export async function createQuickBlockForDay(
  dateStr: string,
  startHour = 9,
  durationHours = 2
) {
  const startsAt = new Date(`${dateStr}T${String(startHour).padStart(2, "0")}:00:00`);
  const endsAt = new Date(startsAt.getTime() + durationHours * 60 * 60 * 1000);

  return createCreatorBlock({
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
  });
}

export type { ScheduleEventType };
