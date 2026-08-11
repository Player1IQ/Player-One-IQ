import assert from "node:assert/strict";
import { test } from "node:test";
import {
  computePlanSyncOperations,
  mapPlanItemToScheduleEvent,
  normalizeDayItems,
  type PlanSyncExistingEvent,
} from "@/lib/creator-ai/plan-sync";
import type { ContentPlanItem, CreatorContentPlan } from "@/lib/creator-ai/plan-types";

function sampleItem(overrides: Partial<ContentPlanItem> = {}): ContentPlanItem {
  return {
    id: "2026-08-12-youtube-video",
    date: "2026-08-12",
    dayOfWeek: "Wednesday",
    platform: "YouTube",
    contentType: "video",
    topic: "Studio tour",
    rationale: "Build trust with long-form content.",
    suggestedTime: "14:00",
    ...overrides,
  };
}

function samplePlan(
  items: ContentPlanItem[],
  id = "plan-a"
): CreatorContentPlan {
  return {
    id,
    organizationId: "org-1",
    creatorId: "creator-1",
    userId: "user-1",
    conversationId: null,
    periodStart: "2026-08-10",
    periodEnd: "2026-08-16",
    status: "draft",
    createdAt: "2026-08-10T12:00:00.000Z",
    updatedAt: "2026-08-10T12:00:00.000Z",
    plan: {
      summary: "Test plan",
      generatedAt: "2026-08-10T12:00:00.000Z",
      weeks: [
        {
          weekStart: "2026-08-10",
          label: "Week of Aug 10",
          items,
        },
      ],
    },
  };
}

test("normalizeDayItems treats equivalent items as equal", () => {
  const left = [sampleItem(), sampleItem({ id: "2026-08-12-tiktok-clip", platform: "TikTok", contentType: "clip", topic: "Quick tip" })];
  const right = [
    sampleItem({ platform: "youtube" }),
    sampleItem({ id: "2026-08-12-tiktok-clip", platform: "TikTok", contentType: "clip", topic: "Quick tip" }),
  ];

  assert.equal(normalizeDayItems(left), normalizeDayItems(right));
});

test("mapPlanItemToScheduleEvent uses defaults and stream duration", () => {
  const video = mapPlanItemToScheduleEvent(sampleItem());
  assert.equal(video.eventType, "block");
  assert.equal(video.startsAt, "2026-08-12T14:00:00.000Z");
  assert.equal(video.endsAt, "2026-08-12T16:00:00.000Z");
  assert.match(video.title, /YouTube Video: Studio tour/);

  const stream = mapPlanItemToScheduleEvent(
    sampleItem({
      id: "2026-08-13-twitch-stream",
      date: "2026-08-13",
      platform: "Twitch",
      contentType: "stream",
      topic: "Ranked grind",
      suggestedTime: undefined,
    })
  );
  assert.equal(stream.eventType, "stream");
  assert.equal(stream.startsAt, "2026-08-13T10:00:00.000Z");
  assert.equal(stream.endsAt, "2026-08-13T12:30:00.000Z");

  const post = mapPlanItemToScheduleEvent(
    sampleItem({
      id: "2026-08-14-instagram-post",
      date: "2026-08-14",
      platform: "Instagram",
      contentType: "post",
      topic: "Behind the scenes",
    })
  );
  assert.equal(post.eventType, "other");
});

test("first activation syncs all days", () => {
  const newPlan = samplePlan([
    sampleItem(),
    sampleItem({
      id: "2026-08-13-twitch-stream",
      date: "2026-08-13",
      platform: "Twitch",
      contentType: "stream",
      topic: "Ranked grind",
    }),
  ]);

  const ops = computePlanSyncOperations(null, newPlan);
  assert.deepEqual(ops.unchangedDays, []);
  assert.equal(ops.changedDays.length, 2);
  assert.equal(ops.itemsToSync.length, 2);
  assert.deepEqual(ops.daysToReplace, ops.changedDays);
});

test("unchanged day preserves items and skips full replace", () => {
  const item = sampleItem();
  const oldPlan = samplePlan([item], "plan-old");
  const newPlan = samplePlan([item], "plan-new");

  const existing: PlanSyncExistingEvent[] = [
    {
      id: "event-1",
      contentPlanId: "plan-old",
      contentPlanItemId: item.id,
      date: item.date,
    },
  ];

  const ops = computePlanSyncOperations(oldPlan, newPlan, existing);
  assert.deepEqual(ops.unchangedDays, ["2026-08-12"]);
  assert.deepEqual(ops.changedDays, []);
  assert.deepEqual(ops.itemsToSync, []);
  assert.deepEqual(ops.daysToReplace, []);
});

test("changed day triggers replace for that day only", () => {
  const unchanged = sampleItem();
  const changedOld = sampleItem({
    id: "2026-08-13-twitch-stream",
    date: "2026-08-13",
    platform: "Twitch",
    contentType: "stream",
    topic: "Ranked grind",
  });
  const changedNew = sampleItem({
    id: "2026-08-13-twitch-stream",
    date: "2026-08-13",
    platform: "Twitch",
    contentType: "stream",
    topic: "Community co-op night",
  });

  const oldPlan = samplePlan([unchanged, changedOld], "plan-old");
  const newPlan = samplePlan([unchanged, changedNew], "plan-new");

  const existing: PlanSyncExistingEvent[] = [
    {
      id: "event-1",
      contentPlanId: "plan-old",
      contentPlanItemId: unchanged.id,
      date: unchanged.date,
    },
  ];

  const ops = computePlanSyncOperations(oldPlan, newPlan, existing);
  assert.deepEqual(ops.unchangedDays, ["2026-08-12"]);
  assert.deepEqual(ops.changedDays, ["2026-08-13"]);
  assert.equal(ops.itemsToSync.length, 1);
  assert.equal(ops.itemsToSync[0]?.topic, "Community co-op night");
  assert.deepEqual(ops.daysToReplace, ["2026-08-13"]);
});

test("unchanged day upserts missing events only", () => {
  const first = sampleItem();
  const second = sampleItem({
    id: "2026-08-12-tiktok-clip",
    platform: "TikTok",
    contentType: "clip",
    topic: "Quick tip",
  });

  const plan = samplePlan([first, second]);
  const existing: PlanSyncExistingEvent[] = [
    {
      id: "event-1",
      contentPlanId: "plan-old",
      contentPlanItemId: first.id,
      date: first.date,
    },
  ];

  const ops = computePlanSyncOperations(plan, plan, existing);
  assert.deepEqual(ops.unchangedDays, ["2026-08-12"]);
  assert.equal(ops.itemsToSync.length, 1);
  assert.equal(ops.itemsToSync[0]?.id, second.id);
});
