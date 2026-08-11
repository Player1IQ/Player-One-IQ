import assert from "node:assert/strict";
import { test } from "node:test";
import {
  generateContentPlanItemId,
  normalizeContentPlanPayload,
  parseContentPlanFromLlmResponse,
  resolvePlanActivationUpdates,
  validateContentPlanPayload,
  type ContentPlanPayload,
} from "@/lib/creator-ai/plan-types";

function samplePlanPayload(): ContentPlanPayload {
  return {
    weeks: [
      {
        weekStart: "2026-08-10",
        label: "Week of Aug 10",
        items: [
          {
            id: "2026-08-12-youtube-video",
            date: "2026-08-12",
            dayOfWeek: "Wednesday",
            platform: "YouTube",
            contentType: "video",
            topic: "Behind-the-scenes studio tour",
            rationale: "Long-form builds trust with your core audience.",
            suggestedTime: "14:00",
          },
        ],
      },
    ],
    summary: "Focus on one anchor video and one clip per week.",
    generatedAt: "2026-08-10T12:00:00.000Z",
  };
}

test("validateContentPlanPayload accepts a well-formed plan", () => {
  const payload = samplePlanPayload();
  assert.deepEqual(validateContentPlanPayload(payload), []);
});

test("validateContentPlanPayload rejects invalid dates and content types", () => {
  const payload = samplePlanPayload();
  payload.weeks[0]!.items[0]!.date = "08-12-2026";
  payload.weeks[0]!.items[0]!.contentType = "podcast" as "video";

  const errors = validateContentPlanPayload(payload);
  assert.ok(errors.some((error) => error.includes("invalid date")));
  assert.ok(errors.some((error) => error.includes("invalid contentType")));
});

test("generateContentPlanItemId produces stable lowercase keys", () => {
  assert.equal(
    generateContentPlanItemId({
      date: "2026-08-12",
      platform: "YouTube",
      contentType: "video",
    }),
    "2026-08-12-youtube-video"
  );

  assert.equal(
    generateContentPlanItemId({
      date: "2026-08-12",
      platform: "Instagram Reels",
      contentType: "reel",
    }),
    "2026-08-12-instagram-reels-reel"
  );
});

test("normalizeContentPlanPayload fills missing ids and dayOfWeek", () => {
  const payload = samplePlanPayload();
  payload.weeks[0]!.items[0]!.id = "";
  payload.weeks[0]!.items[0]!.dayOfWeek = "";

  const normalized = normalizeContentPlanPayload(payload);
  assert.equal(normalized.weeks[0]?.items[0]?.id, "2026-08-12-youtube-video");
  assert.equal(normalized.weeks[0]?.items[0]?.dayOfWeek, "Wednesday");
});

test("parseContentPlanFromLlmResponse parses mock JSON", () => {
  const raw = JSON.stringify({
    weeks: [
      {
        weekStart: "2026-08-10",
        label: "Week of Aug 10",
        items: [
          {
            date: "2026-08-11",
            platform: "Twitch",
            contentType: "stream",
            topic: "Community Q&A stream",
            rationale: "Live engagement boosts retention.",
          },
        ],
      },
    ],
    summary: "Lean into live sessions this week.",
    generatedAt: "2026-08-10T12:00:00.000Z",
  });

  const parsed = parseContentPlanFromLlmResponse(raw);
  assert.equal(parsed.weeks.length, 1);
  assert.equal(parsed.weeks[0]?.items[0]?.id, "2026-08-11-twitch-stream");
  assert.equal(parsed.weeks[0]?.items[0]?.dayOfWeek, "Tuesday");
});

test("resolvePlanActivationUpdates archives prior active plan", () => {
  const updates = resolvePlanActivationUpdates(
    [
      { id: "plan-a", status: "active" },
      { id: "plan-b", status: "draft" },
      { id: "plan-c", status: "archived" },
    ],
    "plan-b"
  );

  assert.deepEqual(updates, [
    { id: "plan-a", status: "archived" },
    { id: "plan-b", status: "active" },
  ]);
});

test("resolvePlanActivationUpdates rejects non-draft targets", () => {
  assert.throws(
    () =>
      resolvePlanActivationUpdates(
        [{ id: "plan-a", status: "active" }],
        "plan-a"
      ),
    /Only draft plans can be activated/
  );
});
