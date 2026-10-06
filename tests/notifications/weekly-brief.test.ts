import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isMondayUtc,
  weeklyBriefWindowKey,
} from "@/lib/notifications/dates";
import {
  buildWeeklyBriefCopy,
  buildWeeklyBriefStats,
  formatSignedPercent,
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
});

describe("weekly brief stats", () => {
  it("skips creators with no history points", () => {
    assert.equal(
      buildWeeklyBriefStats({ creatorName: "Ava", points: [] }),
      null
    );
  });

  it("sends current numbers with no growth on a single history point", () => {
    const points: MetricHistoryPoint[] = [
      { capturedOn: "2026-10-05", audienceSize: 1200, viewTotal: 8400 },
    ];
    const stats = buildWeeklyBriefStats({ creatorName: "Ava", points });
    assert.ok(stats);
    assert.equal(stats.audienceSize, 1200);
    assert.equal(stats.viewTotal, 8400);
    assert.equal(stats.audienceChangePercent, null);
    assert.equal(stats.viewsChangePercent, null);
    assert.equal(stats.previousDate, null);

    const copy = buildWeeklyBriefCopy(stats, "en");
    assert.match(copy.subject, /Ava/);
    assert.equal(
      copy.lines.some((line) => line.includes("Growth stays hidden")),
      true
    );
    assert.equal(
      copy.lines.some((line) => line.includes("%")),
      false
    );
  });

  it("includes change vs the previous snapshot when two points exist", () => {
    const points: MetricHistoryPoint[] = [
      { capturedOn: "2026-09-29", audienceSize: 1000, viewTotal: 8000 },
      { capturedOn: "2026-10-05", audienceSize: 1200, viewTotal: 8400 },
    ];
    const stats = buildWeeklyBriefStats({ creatorName: "Ava", points });
    assert.ok(stats);
    assert.equal(stats.audienceChangePercent, 20);
    assert.equal(stats.viewsChangePercent, 5);
    assert.equal(formatSignedPercent(stats.audienceChangePercent), "+20%");

    const copy = buildWeeklyBriefCopy(stats, "en");
    assert.equal(
      copy.lines.some((line) => line.includes("change since 2026-09-29")),
      true
    );
    assert.equal(
      copy.lines.some((line) => line.includes("+20%")),
      true
    );
  });

  it("uses Spanish copy when the creator prefers es", () => {
    const stats = buildWeeklyBriefStats({
      creatorName: "Ava",
      points: [{ capturedOn: "2026-10-05", audienceSize: 10, viewTotal: 20 }],
    });
    assert.ok(stats);
    const copy = buildWeeklyBriefCopy(stats, "es");
    assert.match(copy.heading, /números semanales/i);
    assert.equal(
      copy.lines.some((line) => line.includes("crecimiento")),
      true
    );
  });
});
