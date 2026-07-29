import assert from "node:assert/strict";
import { test } from "node:test";
import {
  analyzePostingCadence,
  formatDayList,
} from "@/lib/creator-coach/posting-cadence";
import type { PlatformContentSnapshot } from "@/lib/platform-oauth/content-performance";

function snapshot(
  items: PlatformContentSnapshot["items"]
): PlatformContentSnapshot[] {
  return [{ platform: "YouTube", items, connectedViaOAuth: true }];
}

function video(id: string, publishedAt: string) {
  return {
    id,
    title: `Video ${id}`,
    publishedAt,
    contentType: "video" as const,
    viewCount: 100,
    likeCount: 10,
    commentCount: 2,
  };
}

test("formatDayList joins day names naturally", () => {
  assert.equal(formatDayList(["Tuesday"]), "Tuesday");
  assert.equal(formatDayList(["Tuesday", "Thursday"]), "Tuesday and Thursday");
  assert.equal(
    formatDayList(["Tuesday", "Thursday", "Saturday"]),
    "Tuesday, Thursday, and Saturday"
  );
});

test("analyzePostingCadence returns empty insight without enough posts", () => {
  const result = analyzePostingCadence(
    snapshot([video("1", "2026-07-20T12:00:00.000Z")]),
    { now: new Date("2026-07-29T15:00:00.000Z") }
  );

  assert.equal(result.inferred, false);
  assert.equal(result.typicalPostingDays.length, 0);
});

function localVideo(id: string, year: number, month: number, day: number) {
  return video(id, new Date(year, month - 1, day, 12, 0, 0).toISOString());
}

test("analyzePostingCadence infers typical days and missed uploads", () => {
  const items = [];

  for (let week = 0; week < 8; week += 1) {
    const tuesday = new Date(2026, 4, 5 + week * 7, 12, 0, 0);
    const thursday = new Date(tuesday);
    thursday.setDate(tuesday.getDate() + 2);
    const saturday = new Date(tuesday);
    saturday.setDate(tuesday.getDate() + 4);

    items.push(
      video(`t-${week}`, tuesday.toISOString()),
      video(`th-${week}`, thursday.toISOString()),
      video(`s-${week}`, saturday.toISOString())
    );
  }

  const now = new Date(2026, 6, 29, 15, 0, 0);
  const result = analyzePostingCadence(snapshot(items), { now });

  assert.equal(result.inferred, true);
  assert.deepEqual(result.typicalPostingDays, [
    "Tuesday",
    "Thursday",
    "Saturday",
  ]);
  assert.ok(result.missedPostingDaysThisWeek.includes("Tuesday"));
  assert.equal(result.missedPostingDaysThisWeek.includes("Thursday"), false);
  assert.equal(result.missedPostingDaysThisWeek.includes("Saturday"), false);
});
