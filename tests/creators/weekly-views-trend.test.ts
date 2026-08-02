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

  assert.equal(trend.length, 2);
  assert.deepEqual(trend[0], {
    weekStart: "2026-05-18",
    label: "May 18",
    views: 8,
    contentCount: 2,
  });
  assert.deepEqual(trend[1], {
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
  ]);

  assert.equal(trend.length, 1);
  assert.equal(trend[0]?.views, 1);
});
