import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import { getCurrentUserMembership } from "@/lib/permissions";
import {
  canManageOrgScheduleRole,
} from "@/lib/team";
import {
  filterEventsForDay,
  getDayBounds,
} from "./helpers";
import {
  mapScheduleEventRow,
  type ScheduleEvent,
  type ScheduleEventRow,
  type UserNotification,
} from "./types";

const eventSelect = `
  *,
  schedule_event_participants (
    id,
    event_id,
    organization_id,
    user_id,
    creator_id,
    role,
    response_status,
    created_at,
    creators ( name )
  )
`;

export async function getScheduleEventsForRange(
  rangeStart: Date,
  rangeEnd: Date
): Promise<ScheduleEvent[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from("schedule_events")
    .select(eventSelect)
    .eq("organization_id", organizationId)
    .lte("starts_at", rangeEnd.toISOString())
    .gte("ends_at", rangeStart.toISOString())
    .order("starts_at", { ascending: true });

  if (error || !data) return [];
  return (data as ScheduleEventRow[]).map(mapScheduleEventRow);
}

export async function getTodayScheduleEvents(
  now = new Date()
): Promise<ScheduleEvent[]> {
  const { start, end } = getDayBounds(now);
  const events = await getScheduleEventsForRange(start, end);
  return filterEventsForDay(events, now);
}

export async function getScheduleEventById(
  id: string
): Promise<ScheduleEvent | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const organizationId = await getOrganizationId();
  if (!organizationId) return null;

  const { data, error } = await supabase
    .from("schedule_events")
    .select(eventSelect)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) return null;
  return mapScheduleEventRow(data as ScheduleEventRow);
}

export async function canManageOrgSchedule(): Promise<boolean> {
  const membership = await getCurrentUserMembership();
  if (!membership) return false;
  return canManageOrgScheduleRole(membership.role);
}

export async function canCreateCreatorBlocks(): Promise<boolean> {
  const membership = await getCurrentUserMembership();
  if (!membership) return false;
  return Boolean(membership.linkedCreatorId);
}

export interface UserNotificationRow {
  id: string;
  organization_id: string;
  user_id: string;
  notification_type: string;
  title: string;
  body: string | null;
  link: string | null;
  entity_type: string | null;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
}

function formatNotificationTimeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function mapNotificationRow(row: UserNotificationRow): UserNotification {
  return {
    id: row.id,
    title: row.title,
    body: row.body ?? "",
    link: row.link,
    readAt: row.read_at,
    createdAt: row.created_at,
    timeAgo: formatNotificationTimeAgo(row.created_at),
  };
}

export async function getUnreadScheduleNotificationCount(): Promise<number> {
  const supabase = await createClient();
  if (!supabase) return 0;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const organizationId = await getOrganizationId();
  if (!organizationId) return 0;

  const { count, error } = await supabase
    .from("user_notifications")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .eq("notification_type", "schedule")
    .is("read_at", null);

  if (error) return 0;
  return count ?? 0;
}

export async function getUnreadScheduleNotifications(
  limit = 8
): Promise<UserNotification[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from("user_notifications")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .eq("notification_type", "schedule")
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as UserNotificationRow[]).map(mapNotificationRow);
}
