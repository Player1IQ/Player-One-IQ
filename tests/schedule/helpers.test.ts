import assert from "node:assert/strict";
import { test } from "node:test";
import {
  combineDateAndTime,
  filterEventsForDay,
  filterEventsInRange,
  getDayBounds,
  getWeekDays,
  getWeekStart,
  isSameDay,
  resolveScheduleTimes,
  findCreatorBlockConflicts,
} from "@/lib/schedule/helpers";
import { mapScheduleEventRow, type ScheduleEventRow } from "@/lib/schedule/types";

function sampleEvent(
  id: string,
  startsAt: string,
  endsAt: string,
  title = "Event"
) {
  return mapScheduleEventRow({
    id,
    organization_id: "org-1",
    title,
    description: null,
    event_type: "meeting",
    starts_at: startsAt,
    ends_at: endsAt,
    all_day: false,
    created_by: "user-1",
    location: null,
    color: null,
    created_at: startsAt,
    updated_at: startsAt,
    schedule_event_participants: [],
  } satisfies ScheduleEventRow);
}

test("getDayBounds covers full local day", () => {
  const day = new Date(2026, 5, 25, 15, 30, 0);
  const { start, end } = getDayBounds(day);

  assert.equal(start.getHours(), 0);
  assert.equal(start.getMinutes(), 0);
  assert.equal(end.getHours(), 23);
  assert.equal(end.getMinutes(), 59);
});

test("filterEventsForDay returns events overlapping the day sorted by start", () => {
  const day = new Date(2026, 5, 25);
  const events = [
    sampleEvent(
      "late",
      "2026-06-25T14:00:00.000Z",
      "2026-06-25T15:00:00.000Z",
      "Late"
    ),
    sampleEvent(
      "early",
      "2026-06-25T09:00:00.000Z",
      "2026-06-25T10:00:00.000Z",
      "Early"
    ),
    sampleEvent(
      "other-day",
      "2026-06-26T09:00:00.000Z",
      "2026-06-26T10:00:00.000Z",
      "Other"
    ),
  ];

  const result = filterEventsForDay(events, day);
  assert.equal(result.length, 2);
  assert.equal(result[0]?.title, "Early");
  assert.equal(result[1]?.title, "Late");
});

test("filterEventsInRange includes spanning events", () => {
  const events = [
    sampleEvent(
      "span",
      "2026-06-24T22:00:00.000Z",
      "2026-06-26T01:00:00.000Z",
      "Span"
    ),
  ];

  const rangeStart = new Date(2026, 5, 25, 0, 0, 0);
  const rangeEnd = new Date(2026, 5, 25, 23, 59, 59, 999);
  const result = filterEventsInRange(events, rangeStart, rangeEnd);
  assert.equal(result.length, 1);
});

test("getWeekStart returns Monday on or before the anchor day", () => {
  const anchor = new Date(2026, 5, 25);
  const weekStart = getWeekStart(anchor);
  assert.equal(weekStart.getDay(), 1);
  assert.ok(weekStart.getTime() <= anchor.getTime());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  assert.ok(weekEnd.getTime() >= anchor.getTime());
});

test("getWeekDays returns seven consecutive days", () => {
  const days = getWeekDays(new Date(2026, 5, 25));
  assert.equal(days.length, 7);
  assert.ok(isSameDay(days[0]!, getWeekStart(new Date(2026, 5, 25))));
  assert.equal(days[6]!.getDate(), days[0]!.getDate() + 6);
});

test("combineDateAndTime builds local datetime", () => {
  const value = combineDateAndTime("2026-06-25", "14:30");
  assert.equal(value.getFullYear(), 2026);
  assert.equal(value.getMonth(), 5);
  assert.equal(value.getDate(), 25);
  assert.equal(value.getHours(), 14);
  assert.equal(value.getMinutes(), 30);
});

test("resolveScheduleTimes validates datetime-local values", () => {
  const result = resolveScheduleTimes({
    allDay: false,
    allDayDate: "2026-06-25",
    startsAtLocal: "2026-06-25T09:00",
    endsAtLocal: "2026-06-25T10:30",
  });
  assert.ok(!("error" in result));
  assert.ok(new Date(result.endsAt).getTime() > new Date(result.startsAt).getTime());
});

test("resolveScheduleTimes builds all-day bounds", () => {
  const result = resolveScheduleTimes({
    allDay: true,
    allDayDate: "2026-06-25",
    startsAtLocal: "",
    endsAtLocal: "",
  });
  assert.ok(!("error" in result));
  const start = new Date(result.startsAt);
  const end = new Date(result.endsAt);
  assert.equal(start.getHours(), 0);
  assert.equal(end.getHours(), 23);
});

test("findCreatorBlockConflicts detects overlapping creator blocks", () => {
  const block = mapScheduleEventRow({
    id: "block-1",
    organization_id: "org-1",
    title: "Unavailable",
    description: null,
    event_type: "block",
    starts_at: "2026-06-25T14:00:00.000Z",
    ends_at: "2026-06-25T16:00:00.000Z",
    all_day: false,
    created_by: "creator-user",
    location: null,
    color: null,
    created_at: "2026-06-25T14:00:00.000Z",
    updated_at: "2026-06-25T14:00:00.000Z",
    schedule_event_participants: [
      {
        id: "part-1",
        event_id: "block-1",
        organization_id: "org-1",
        user_id: null,
        creator_id: "creator-1",
        role: "organizer",
        response_status: "accepted",
        created_at: "2026-06-25T14:00:00.000Z",
      },
    ],
  } satisfies ScheduleEventRow);

  const conflicts = findCreatorBlockConflicts(
    [block],
    ["creator-1"],
    {
      startsAt: "2026-06-25T15:00:00.000Z",
      endsAt: "2026-06-25T17:00:00.000Z",
    }
  );

  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0]?.title, "Unavailable");
});
