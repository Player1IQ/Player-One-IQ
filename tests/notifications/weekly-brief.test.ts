import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  addUtcDays,
  daysBetweenUtcDays,
  isMondayUtc,
  weeklyBriefWindowKey,
} from "@/lib/notifications/dates";
import {
  buildWeeklyBriefCopy,
  buildWeeklyBriefStats,
  formatSignedPercent,
  isWeeklyBriefEnabled,
} from "@/lib/notifications/weekly-brief";
import type { MetricHistoryPoint } from "@/lib/platform-oauth/metric-history";

describe("weekly brief schedule", () => {
  it("only sends on Monday UTC", () => {
    assert.equal(isMondayUtc(new Date("2026-10-06T14:00:00.000Z")), false);
    assert.equal(isMondayUtc(new Date("2026-10-05T14:00:00.000Z")), true);
    assert.equal(
      weeklyBriefWindowKey(new Date("2026-10-05T14:00:00.000Z")),
      "week-2026-10-05"
    );
  });

  it("stays off unless WEEKLY_BRIEF_ENABLED is explicitly on", () => {
    const previous = process.env.WEEKLY_BRIEF_ENABLED;
    try {
      delete process.env.WEEKLY_BRIEF_ENABLED;
      assert.equal(isWeeklyBriefEnabled(), false);
      process.env.WEEKLY_BRIEF_ENABLED = "false";
      assert.equal(isWeeklyBriefEnabled(), false);
      process.env.WEEKLY_BRIEF_ENABLED = "true";
      assert.equal(isWeeklyBriefEnabled(), true);
    } finally {
      if (previous === undefined) delete process.env.WEEKLY_BRIEF_ENABLED;
      else process.env.WEEKLY_BRIEF_ENABLED = previous;
    }
  });
});

function dailyPoints(startIso: string, days: number): MetricHistoryPoint[] {
  const start = new Date(`${startIso}T00:00:00.000Z`);
  return Array.from({ length: days }, (_, index) => ({
    capturedOn: addUtcDays(start, index),
    audienceSize: 1000 + index * 10,
    viewTotal: 8000 + index * 40,
  }));
}

describe("weekly brief stats", () => {
  it("skips creators with no history points", () => {
    assert.equal(
      buildWeeklyBriefStats({
        creatorName: "Ava",
        points: [],
        sendDate: "2026-10-12",
      }),
      null
    );
  });

  it("sends current numbers with no growth when no snapshot is 5-9 days earlier", () => {
    const points: MetricHistoryPoint[] = [
      { capturedOn: "2026-10-11", audienceSize: 1190, viewTotal: 8360 },
      { capturedOn: "2026-10-12", audienceSize: 1200, viewTotal: 8400 },
    ];
    const stats = buildWeeklyBriefStats({
      creatorName: "Ava",
      points,
      sendDate: "2026-10-12",
    });
    assert.ok(stats);
    assert.equal(stats.asOfDate, "2026-10-12");
    assert.equal(stats.previousDate, null);
    assert.equal(stats.audienceChangePercent, null);
    assert.equal(stats.viewsChangePercent, null);

    const copy = buildWeeklyBriefCopy(stats, "en");
    assert.equal(
      copy.lines.some((line) => line.includes("current numbers only")),
      true
    );
    assert.equal(
      copy.lines.some((line) => line.includes("%")),
      false
    );
  });

  it("compares against the snapshot closest to 7 days before send, not the previous day", () => {
    const points = dailyPoints("2026-10-05", 8);
    const stats = buildWeeklyBriefStats({
      creatorName: "Ava",
      points,
      sendDate: "2026-10-12",
    });
    assert.ok(stats);
    assert.equal(stats.asOfDate, "2026-10-12");
    assert.equal(stats.previousDate, "2026-10-05");
    assert.equal(daysBetweenUtcDays(stats.asOfDate, stats.previousDate), 7);
    assert.notEqual(daysBetweenUtcDays(stats.asOfDate, stats.previousDate), 1);
    assert.equal(formatSignedPercent(stats.audienceChangePercent), "+7%");

    const copy = buildWeeklyBriefCopy(stats, "en");
    assert.equal(
      copy.lines.some((line) => line.includes("Compared 2026-10-05 to 2026-10-12")),
      true
    );
  });

  it("never produces a one-day change from daily history", () => {
    const points = dailyPoints("2026-10-01", 14);
    const stats = buildWeeklyBriefStats({
      creatorName: "Ava",
      points,
      sendDate: "2026-10-12",
    });
    assert.ok(stats);
    assert.ok(stats.previousDate);
    const gap = daysBetweenUtcDays(stats.asOfDate, stats.previousDate);
    assert.ok(gap >= 5 && gap <= 9);
    assert.notEqual(gap, 1);
  });

  it("uses Spanish copy when the creator prefers es", () => {
    const stats = buildWeeklyBriefStats({
      creatorName: "Ava",
      points: [{ capturedOn: "2026-10-12", audienceSize: 10, viewTotal: 20 }],
      sendDate: "2026-10-12",
    });
    assert.ok(stats);
    const copy = buildWeeklyBriefCopy(stats, "es");
    assert.match(copy.heading, /números semanales/i);
    assert.equal(
      copy.lines.some((line) => line.includes("números actuales")),
      true
    );
  });
});
