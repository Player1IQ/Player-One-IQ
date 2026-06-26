import type { ScheduleEvent } from "./types";

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function getDayBounds(date: Date): { start: Date; end: Date } {
  return { start: startOfDay(date), end: endOfDay(date) };
}

export function eventOverlapsRange(
  event: Pick<ScheduleEvent, "startsAt" | "endsAt">,
  rangeStart: Date,
  rangeEnd: Date
): boolean {
  const start = new Date(event.startsAt).getTime();
  const end = new Date(event.endsAt).getTime();
  return start <= rangeEnd.getTime() && end >= rangeStart.getTime();
}

export function filterEventsForDay(
  events: ScheduleEvent[],
  day: Date
): ScheduleEvent[] {
  const { start, end } = getDayBounds(day);
  return filterEventsInRange(events, start, end).sort(
    (a, b) =>
      new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );
}

export function filterEventsInRange(
  events: ScheduleEvent[],
  rangeStart: Date,
  rangeEnd: Date
): ScheduleEvent[] {
  return events.filter((event) =>
    eventOverlapsRange(event, rangeStart, rangeEnd)
  );
}

export function getWeekStart(date: Date): Date {
  const day = startOfDay(date);
  const dayOfWeek = day.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  day.setDate(day.getDate() + diff);
  return day;
}

export function getWeekDays(anchorDate: Date): Date[] {
  const weekStart = getWeekStart(anchorDate);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    return day;
  });
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toTimeInputValue(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function combineDateAndTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes ?? 0, 0, 0);
}

export function toDateTimeLocalValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function parseDateTimeLocalValue(value: string): Date | null {
  if (!value || !value.includes("T")) return null;
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return null;
  }
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export function addHoursToDateTimeLocal(
  value: string,
  hours: number
): string | null {
  const date = parseDateTimeLocalValue(value);
  if (!date) return null;
  date.setHours(date.getHours() + hours);
  return toDateTimeLocalValue(date);
}

export function formatScheduleWhen(
  startsAt: string,
  endsAt: string,
  allDay?: boolean
): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  if (allDay) {
    return start.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  const datePart = start.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const startTime = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const endTime = end.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${datePart} · ${startTime} – ${endTime}`;
}

export function formatScheduleNotificationBody(
  title: string,
  startsAt: string,
  endsAt: string,
  allDay?: boolean
): string {
  return `${title} — ${formatScheduleWhen(startsAt, endsAt, allDay)}`;
}

export function formatSchedulePreview(
  startsAt: Date,
  endsAt: Date,
  allDay: boolean
): string {
  if (allDay) {
    const sameDay =
      startsAt.getFullYear() === endsAt.getFullYear() &&
      startsAt.getMonth() === endsAt.getMonth() &&
      startsAt.getDate() === endsAt.getDate();
    const startLabel = startsAt.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    if (sameDay) return `${startLabel} · All day`;
    const endLabel = endsAt.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    return `${startLabel} – ${endLabel} · All day`;
  }

  const sameDay =
    startsAt.getFullYear() === endsAt.getFullYear() &&
    startsAt.getMonth() === endsAt.getMonth() &&
    startsAt.getDate() === endsAt.getDate();

  const dateLabel = startsAt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const startTime = startsAt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const endTime = endsAt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (sameDay) {
    return `${dateLabel} · ${startTime} – ${endTime}`;
  }

  const endDateLabel = endsAt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `${dateLabel} ${startTime} – ${endDateLabel} ${endTime}`;
}

export function resolveScheduleTimes(input: {
  allDay: boolean;
  allDayDate: string;
  startsAtLocal: string;
  endsAtLocal: string;
}): { startsAt: string; endsAt: string } | { error: string } {
  if (input.allDay) {
    if (!input.allDayDate) {
      return { error: "Choose a date for this all-day block." };
    }
    const [year, month, day] = input.allDayDate.split("-").map(Number);
    const start = new Date(year, month - 1, day, 0, 0, 0, 0);
    const end = new Date(year, month - 1, day, 23, 59, 59, 999);
    return { startsAt: start.toISOString(), endsAt: end.toISOString() };
  }

  const start = parseDateTimeLocalValue(input.startsAtLocal);
  const end = parseDateTimeLocalValue(input.endsAtLocal);
  if (!start || !end) {
    return { error: "Enter a valid start and end time." };
  }
  if (end.getTime() <= start.getTime()) {
    return { error: "End time must be after start time." };
  }

  return { startsAt: start.toISOString(), endsAt: end.toISOString() };
}

export function formatActionError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return "Something went wrong while saving. Please try again.";
}

export function scheduleTimesOverlap(
  left: Pick<ScheduleEvent, "startsAt" | "endsAt">,
  right: Pick<ScheduleEvent, "startsAt" | "endsAt">
): boolean {
  const leftStart = new Date(left.startsAt).getTime();
  const leftEnd = new Date(left.endsAt).getTime();
  const rightStart = new Date(right.startsAt).getTime();
  const rightEnd = new Date(right.endsAt).getTime();
  return leftStart < rightEnd && rightStart < leftEnd;
}

export const CREATOR_BLOCK_SCHEDULING_ERROR =
  "Cannot schedule during blocked time for one or more invited creators.";

export function findCreatorBlockConflicts(
  events: ScheduleEvent[],
  creatorIds: string[],
  proposed: Pick<ScheduleEvent, "startsAt" | "endsAt">
): ScheduleEvent[] {
  if (creatorIds.length === 0) return [];

  const creatorIdSet = new Set(creatorIds);
  return events.filter(
    (event) =>
      event.isBlock &&
      scheduleTimesOverlap(event, proposed) &&
      event.participants.some(
        (participant) =>
          participant.creatorId !== null &&
          creatorIdSet.has(participant.creatorId)
      )
  );
}

function creatorNameFromBlock(
  block: ScheduleEvent,
  invitedCreatorIds: string[]
): string {
  const match = block.participants.find(
    (participant) =>
      participant.creatorId !== null &&
      invitedCreatorIds.includes(participant.creatorId)
  );
  return match?.creatorName ?? "A creator";
}

export function formatCreatorBlockConflictMessage(
  conflicts: ScheduleEvent[],
  invitedCreatorIds: string[]
): string {
  if (conflicts.length === 0) return "";
  if (conflicts.length === 1) {
    const name = creatorNameFromBlock(conflicts[0]!, invitedCreatorIds);
    return `Cannot schedule during this time — ${name} has blocked it.`;
  }
  return `Cannot schedule during this time — ${conflicts.length} invited creators have blocked it.`;
}
