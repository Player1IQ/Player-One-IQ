import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildWeeklyViewsTrend,
  type ContentTrendPoint,
} from "@/lib/platform-oauth/creator-analytics";

function point(
  overrides: Partial<ContentTrendPoint> & Pick<ContentTrendPoint, "publishedAt" | "views">
): ContentTrendPoint {
  return {
    id: "test-1",
    label: "Test",
    engagement: 0,
    platform: "Twitch",
    ...overrides,
  };
}

test("buildWeeklyViewsTrend groups views by week start (Monday UTC)", () => {
  const trend = buildWeeklyViewsTrend([
    point({ id: "a", publishedAt: "2026-05-20T12:00:00.000Z", views: 3 }),
    point({ id: "b", publishedAt: "2026-05-22T12:00:00.000Z", views: 5 }),
    point({ id: "c", publishedAt: "2026-05-28T12:00:00.000Z", views: 2 }),
  ], new Date("2026-06-01T12:00:00.000Z"));

  assert.equal(trend.length, 12);
  const may18 = trend.find((entry) => entry.weekStart === "2026-05-18");
  const may25 = trend.find((entry) => entry.weekStart === "2026-05-25");
  assert.deepEqual(may18, {
    weekStart: "2026-05-18",
    label: "May 18",
    views: 8,
    contentCount: 2,
  });
  assert.deepEqual(may25, {
    weekStart: "2026-05-25",
    label: "May 25",
    views: 2,
    contentCount: 1,
  });
});

test("buildWeeklyViewsTrend skips items with invalid publish dates", () => {
  const trend = buildWeeklyViewsTrend([
    point({ publishedAt: "", views: 4 }),
    point({ publishedAt: "2026-06-03T12:00:00.000Z", views: 1 }),
  ], new Date("2026-06-10T12:00:00.000Z"));

  assert.equal(trend.length, 12);
  const activeWeek = trend.find((entry) => entry.views > 0);
  assert.equal(activeWeek?.views, 1);
});

test("buildWeeklyViewsTrend ignores content outside the recent lookback window", () => {
  const trend = buildWeeklyViewsTrend([
    point({ publishedAt: "2020-01-08T12:00:00.000Z", views: 99 }),
    point({ publishedAt: "2026-05-28T12:00:00.000Z", views: 4 }),
  ], new Date("2026-06-01T12:00:00.000Z"));

  assert.equal(trend.length, 12);
  assert.equal(trend.reduce((sum, entry) => sum + entry.views, 0), 4);
  assert.ok(!trend.some((entry) => entry.label.includes("2020")));
});
