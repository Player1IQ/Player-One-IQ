export type ScheduleEventType =
  | "block"
  | "meeting"
  | "practice"
  | "stream"
  | "other";

export type ScheduleParticipantRole = "organizer" | "attendee" | "optional";

export type ScheduleResponseStatus = "pending" | "accepted" | "declined";

export const scheduleEventTypes: ScheduleEventType[] = [
  "block",
  "meeting",
  "practice",
  "stream",
  "other",
];

export const scheduleEventTypeLabels: Record<ScheduleEventType, string> = {
  block: "Blocked time",
  meeting: "Meeting",
  practice: "Practice",
  stream: "Stream",
  other: "Other",
};

export const scheduleEventTypeColors: Record<ScheduleEventType, string> = {
  block: "#6b7280",
  meeting: "#8b5cf6",
  practice: "#10b981",
  stream: "#f59e0b",
  other: "#3b82f6",
};

export interface ScheduleParticipantRow {
  id: string;
  event_id: string;
  organization_id: string;
  user_id: string | null;
  creator_id: string | null;
  role: ScheduleParticipantRole;
  response_status: ScheduleResponseStatus;
  created_at: string;
  creators?: { name: string } | { name: string }[] | null;
  team_members?: { user_id: string } | { user_id: string }[] | null;
}

export interface ScheduleEventRow {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  event_type: ScheduleEventType;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  created_by: string | null;
  location: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
  schedule_event_participants?: ScheduleParticipantRow[] | null;
}

export interface ScheduleParticipant {
  id: string;
  eventId: string;
  userId: string | null;
  creatorId: string | null;
  creatorName: string | null;
  role: ScheduleParticipantRole;
  responseStatus: ScheduleResponseStatus;
}

export interface ScheduleEvent {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  eventType: ScheduleEventType;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  createdBy: string | null;
  location: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  participants: ScheduleParticipant[];
  startsAtDisplay: string;
  endsAtDisplay: string;
  timeRangeDisplay: string;
  isBlock: boolean;
}

export interface ScheduleEventInput {
  title: string;
  description?: string;
  eventType: ScheduleEventType;
  startsAt: string;
  endsAt: string;
  allDay?: boolean;
  location?: string;
  color?: string;
  participantUserIds?: string[];
  participantCreatorIds?: string[];
}

export interface UserNotification {
  id: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
  timeAgo: string;
}

export interface ScheduleBlockInput {
  title?: string;
  startsAt: string;
  endsAt: string;
  allDay?: boolean;
}

function relationName(
  relation:
    | { name?: string }
    | { name?: string }[]
    | null
    | undefined
): string | null {
  if (!relation) return null;
  const row = Array.isArray(relation) ? relation[0] : relation;
  return row?.name ?? null;
}

function mapParticipantRow(row: ScheduleParticipantRow): ScheduleParticipant {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    creatorId: row.creator_id,
    creatorName: relationName(row.creators),
    role: row.role,
    responseStatus: row.response_status,
  };
}

function formatEventTime(iso: string, allDay: boolean): string {
  const date = new Date(iso);
  if (allDay) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatScheduleTimeRange(event: {
  startsAt: string;
  endsAt: string;
  allDay: boolean;
}): string {
  if (event.allDay) return "All day";
  const start = formatEventTime(event.startsAt, false);
  const end = formatEventTime(event.endsAt, false);
  return `${start} – ${end}`;
}

export function mapScheduleEventRow(row: ScheduleEventRow): ScheduleEvent {
  const participants = (row.schedule_event_participants ?? []).map(
    mapParticipantRow
  );
  const eventType = row.event_type;
  const allDay = row.all_day;

  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    description: row.description ?? "",
    eventType,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    allDay,
    createdBy: row.created_by,
    location: row.location ?? "",
    color: row.color ?? scheduleEventTypeColors[eventType],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    participants,
    startsAtDisplay: formatEventTime(row.starts_at, allDay),
    endsAtDisplay: formatEventTime(row.ends_at, allDay),
    timeRangeDisplay: formatScheduleTimeRange({
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      allDay,
    }),
    isBlock: eventType === "block",
  };
}
