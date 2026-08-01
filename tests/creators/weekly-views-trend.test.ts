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
    point({ id: "a", publishedAt: "2026-06-03T12:00:00.000Z", views: 3 }),
    point({ id: "b", publishedAt: "2026-06-05T12:00:00.000Z", views: 5 }),
    point({ id: "c", publishedAt: "2026-06-10T12:00:00.000Z", views: 2 }),
  ]);

  assert.equal(trend.length, 2);
  assert.deepEqual(trend[0], {
    weekStart: "2026-06-01",
    label: "Jun 1",
    views: 8,
    contentCount: 2,
  });
  assert.deepEqual(trend[1], {
    weekStart: "2026-06-08",
    label: "Jun 8",
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
