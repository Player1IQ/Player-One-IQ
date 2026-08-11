import { createClient } from "@/lib/supabase/server";
import type { ScheduleEventType } from "@/lib/schedule/types";
import type { ContentPlanItem, CreatorContentPlan } from "./plan-types";

const DEFAULT_START_TIME = "10:00";
const DEFAULT_DURATION_HOURS = 2;
const STREAM_DURATION_HOURS = 2.5;

export interface PlanItemScheduleMapping {
  title: string;
  description: string;
  eventType: ScheduleEventType;
  startsAt: string;
  endsAt: string;
  allDay: false;
}

export interface PlanSyncExistingEvent {
  id: string;
  contentPlanId: string | null;
  contentPlanItemId: string | null;
  date: string;
}

export interface PlanSyncOperations {
  unchangedDays: string[];
  changedDays: string[];
  itemsToSync: ContentPlanItem[];
  daysToReplace: string[];
}

export interface PlanSyncSummary {
  daysSynced: number;
  daysUnchanged: number;
  eventsCreated: number;
  eventsUpdated: number;
  eventsSkipped: number;
  eventsDeleted: number;
  errors: string[];
}

function allPlanItems(plan: CreatorContentPlan): ContentPlanItem[] {
  return plan.plan.weeks.flatMap((week) => week.items);
}

function itemsByDate(plan: CreatorContentPlan): Map<string, ContentPlanItem[]> {
  const map = new Map<string, ContentPlanItem[]>();
  for (const item of allPlanItems(plan)) {
    const bucket = map.get(item.date) ?? [];
    bucket.push(item);
    map.set(item.date, bucket);
  }
  for (const [date, items] of map) {
    map.set(
      date,
      [...items].sort((left, right) => left.id.localeCompare(right.id))
    );
  }
  return map;
}

function normalizedItemSnapshot(item: ContentPlanItem) {
  return {
    id: item.id,
    platform: item.platform.trim().toLowerCase(),
    contentType: item.contentType,
    topic: item.topic.trim(),
    rationale: item.rationale.trim(),
    suggestedTime: item.suggestedTime ?? null,
  };
}

export function normalizeDayItems(items: ContentPlanItem[]): string {
  return JSON.stringify(
    [...items]
      .map(normalizedItemSnapshot)
      .sort((left, right) => left.id.localeCompare(right.id))
  );
}

export function mapPlanItemToScheduleEvent(
  item: ContentPlanItem
): PlanItemScheduleMapping {
  const time = item.suggestedTime ?? DEFAULT_START_TIME;
  const startsAt = `${item.date}T${time}:00.000Z`;
  const durationHours =
    item.contentType === "stream" ? STREAM_DURATION_HOURS : DEFAULT_DURATION_HOURS;
  const startMs = new Date(startsAt).getTime();
  const endsAt = new Date(startMs + durationHours * 60 * 60 * 1000).toISOString();

  let eventType: ScheduleEventType = "block";
  if (item.contentType === "stream") {
    eventType = "stream";
  } else if (
    item.contentType === "post" ||
    item.contentType === "reel" ||
    item.contentType === "clip"
  ) {
    eventType = "other";
  }

  const platformLabel = item.platform.trim();
  const typeLabel =
    item.contentType.charAt(0).toUpperCase() + item.contentType.slice(1);

  return {
    title: `${platformLabel} ${typeLabel}: ${item.topic.trim()}`,
    description: [
      item.rationale.trim(),
      `Platform: ${platformLabel}`,
      `Content type: ${typeLabel}`,
    ].join("\n"),
    eventType,
    startsAt,
    endsAt,
    allDay: false,
  };
}

export function computePlanSyncOperations(
  oldPlan: CreatorContentPlan | null | undefined,
  newPlan: CreatorContentPlan,
  existingEvents: PlanSyncExistingEvent[] = []
): PlanSyncOperations {
  const newByDate = itemsByDate(newPlan);
  const oldByDate = oldPlan ? itemsByDate(oldPlan) : new Map<string, ContentPlanItem[]>();

  const allDates = new Set<string>([
    ...newByDate.keys(),
    ...oldByDate.keys(),
  ]);

  const unchangedDays: string[] = [];
  const changedDays: string[] = [];
  const itemsToSync: ContentPlanItem[] = [];

  if (!oldPlan) {
    for (const date of [...allDates].sort()) {
      changedDays.push(date);
      itemsToSync.push(...(newByDate.get(date) ?? []));
    }
    return {
      unchangedDays,
      changedDays,
      itemsToSync,
      daysToReplace: changedDays,
    };
  }

  for (const date of [...allDates].sort()) {
    const oldItems = oldByDate.get(date) ?? [];
    const newItems = newByDate.get(date) ?? [];

    if (normalizeDayItems(oldItems) === normalizeDayItems(newItems)) {
      unchangedDays.push(date);
      const existingItemIds = new Set(
        existingEvents
          .filter((event) => event.date === date && event.contentPlanItemId)
          .map((event) => event.contentPlanItemId as string)
      );
      for (const item of newItems) {
        if (!existingItemIds.has(item.id)) {
          itemsToSync.push(item);
        }
      }
      continue;
    }

    changedDays.push(date);
    itemsToSync.push(...newItems);
  }

  return {
    unchangedDays,
    changedDays,
    itemsToSync,
    daysToReplace: changedDays,
  };
}

function eventDateFromStartsAt(startsAt: string): string {
  return startsAt.slice(0, 10);
}

export async function fetchPlanLinkedScheduleEvents(input: {
  organizationId: string;
  creatorId: string;
  planId?: string | null;
  rangeStart?: string;
  rangeEnd?: string;
}): Promise<PlanSyncExistingEvent[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  let query = supabase
    .from("schedule_events")
    .select(
      `
      id,
      content_plan_id,
      content_plan_item_id,
      starts_at,
      schedule_event_participants!inner (
        creator_id,
        role
      )
    `
    )
    .eq("organization_id", input.organizationId)
    .not("content_plan_id", "is", null)
    .eq("schedule_event_participants.creator_id", input.creatorId)
    .eq("schedule_event_participants.role", "organizer");

  if (input.planId) {
    query = query.eq("content_plan_id", input.planId);
  }
  if (input.rangeStart) {
    query = query.gte("starts_at", input.rangeStart);
  }
  if (input.rangeEnd) {
    query = query.lte("starts_at", input.rangeEnd);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    contentPlanId: (row.content_plan_id as string | null) ?? null,
    contentPlanItemId: (row.content_plan_item_id as string | null) ?? null,
    date: eventDateFromStartsAt(row.starts_at as string),
  }));
}

export async function syncContentPlanToSchedule(input: {
  planId: string;
  userId: string;
  creatorId: string;
  organizationId: string;
  newPlan: CreatorContentPlan;
  previousActivePlan?: CreatorContentPlan | null;
}): Promise<PlanSyncSummary> {
  const supabase = await createClient();
  const summary: PlanSyncSummary = {
    daysSynced: 0,
    daysUnchanged: 0,
    eventsCreated: 0,
    eventsUpdated: 0,
    eventsSkipped: 0,
    eventsDeleted: 0,
    errors: [],
  };

  if (!supabase) return summary;

  const existingEvents = await fetchPlanLinkedScheduleEvents({
    organizationId: input.organizationId,
    creatorId: input.creatorId,
    planId: input.previousActivePlan?.id ?? null,
    rangeStart: `${input.newPlan.periodStart}T00:00:00.000Z`,
    rangeEnd: `${input.newPlan.periodEnd}T23:59:59.999Z`,
  });

  const operations = computePlanSyncOperations(
    input.previousActivePlan,
    input.newPlan,
    existingEvents
  );

  summary.daysSynced = operations.changedDays.length;
  summary.daysUnchanged = operations.unchangedDays.length;

  const existingByItemId = new Map(
    existingEvents
      .filter((event) => event.contentPlanItemId)
      .map((event) => [event.contentPlanItemId as string, event])
  );

  if (input.previousActivePlan) {
    for (const date of operations.daysToReplace) {
      const { data: deletedCount, error: deleteError } = await supabase.rpc(
        "delete_creator_plan_schedule_events_for_day",
        {
          p_organization_id: input.organizationId,
          p_plan_id: input.previousActivePlan.id,
          p_date: date,
        }
      );

      if (deleteError) {
        summary.errors.push(
          `Could not clear ${date}: ${deleteError.message}`
        );
      } else if (typeof deletedCount === "number") {
        summary.eventsDeleted += deletedCount;
      }
    }
  }

  for (const item of operations.itemsToSync) {
    const mapping = mapPlanItemToScheduleEvent(item);
    const hadExisting = existingByItemId.has(item.id);

    const { error } = await supabase.rpc("upsert_creator_plan_schedule_event", {
      p_organization_id: input.organizationId,
      p_plan_id: input.planId,
      p_plan_item_id: item.id,
      p_title: mapping.title,
      p_description: mapping.description,
      p_event_type: mapping.eventType,
      p_starts_at: mapping.startsAt,
      p_ends_at: mapping.endsAt,
      p_all_day: mapping.allDay,
    });

    if (error) {
      summary.errors.push(`${item.id}: ${error.message}`);
      continue;
    }

    if (hadExisting) {
      summary.eventsUpdated += 1;
    } else {
      summary.eventsCreated += 1;
    }
  }

  for (const date of operations.unchangedDays) {
    const items = itemsByDate(input.newPlan).get(date) ?? [];
    for (const item of items) {
      if (operations.itemsToSync.some((syncItem) => syncItem.id === item.id)) {
        continue;
      }

      const existing = existingByItemId.get(item.id);
      if (existing && existing.contentPlanId === input.planId) {
        summary.eventsSkipped += 1;
        continue;
      }

      if (existing) {
        const mapping = mapPlanItemToScheduleEvent(item);
        const { error } = await supabase.rpc("upsert_creator_plan_schedule_event", {
          p_organization_id: input.organizationId,
          p_plan_id: input.planId,
          p_plan_item_id: item.id,
          p_title: mapping.title,
          p_description: mapping.description,
          p_event_type: mapping.eventType,
          p_starts_at: mapping.startsAt,
          p_ends_at: mapping.endsAt,
          p_all_day: mapping.allDay,
        });
        if (error) {
          summary.errors.push(`${item.id}: ${error.message}`);
        } else {
          summary.eventsUpdated += 1;
        }
        continue;
      }

      summary.eventsSkipped += 1;
    }
  }

  return summary;
}
