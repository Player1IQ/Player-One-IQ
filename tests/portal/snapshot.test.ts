import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isFunnelEventName,
  isFunnelSessionId,
  parseFunnelPlatform,
} from "@/lib/marketing/funnel";
import {
  pickGrowthPair,
  weekOverWeekPercent,
} from "@/lib/platform-oauth/metric-history";
import { analyzeStreamTiming } from "@/lib/creator-coach/stream-timing";
import { buildSnapshotInsights } from "@/lib/portal/snapshot";
import { buildCreatorSnapshotFirstWeekPlan } from "@/lib/portal/first-week-plan";
import { launchOAuthPlatforms } from "@/lib/platform-oauth/types";
import { getOAuthPlatformUi } from "@/lib/platform-oauth/config";

test("funnel session ids must be UUIDs", () => {
  assert.equal(isFunnelSessionId("not-a-uuid"), false);
  assert.equal(
    isFunnelSessionId("2c9d2a3e-1b7a-4f0d-9c1e-8a6b5d4c3b2a"),
    true
  );
});

test("funnel events are an allowlist", () => {
  assert.equal(isFunnelEventName("visit"), true);
  assert.equal(isFunnelEventName("signup"), true);
  assert.equal(isFunnelEventName("email"), false);
  assert.equal(parseFunnelPlatform("Twitch"), "Twitch");
  assert.equal(parseFunnelPlatform("email"), null);
});

test("week-over-week growth requires two positive history points", () => {
  assert.equal(weekOverWeekPercent(120, 100), 20);
  assert.equal(weekOverWeekPercent(100, 0), null);
  assert.equal(weekOverWeekPercent(100, null), null);
  assert.equal(pickGrowthPair([{ capturedOn: "2026-10-01", audienceSize: 10, viewTotal: 1 }]), null);
  const pair = pickGrowthPair([
    { capturedOn: "2026-10-01", audienceSize: 100, viewTotal: 10 },
    { capturedOn: "2026-10-08", audienceSize: 120, viewTotal: 12 },
  ]);
  assert.equal(pair?.previous.audienceSize, 100);
  assert.equal(pair?.current.audienceSize, 120);
});

test("stream timing stays empty without enough VODs", () => {
  const thin = analyzeStreamTiming([
    {
      platform: "Twitch",
      connectedViaOAuth: true,
      items: [
        {
          id: "1",
          title: "One",
          publishedAt: "2026-09-01T18:00:00.000Z",
          contentType: "stream",
          viewCount: 10,
        },
      ],
    },
  ]);
  assert.equal(thin.inferred, false);
  assert.equal(thin.peaks.length, 0);
});

test("disconnected snapshot insights do not invent numbers", () => {
  const insights = buildSnapshotInsights({
    connected: false,
    audienceSize: null,
    historyPointCount: 0,
    recentViews: 0,
    contentCount: 0,
    cadenceInferred: false,
    typicalDays: [],
    streamTimesInferred: false,
    streamTimesLabel: null,
  });
  assert.equal(insights.length, 3);
  assert.equal(
    insights.some((insight) => /\d{2,}/.test(insight.body) && insight.body.includes("%")),
    false
  );
});

test("first-week plan for empty channels asks to connect Twitch or Kick", () => {
  const plan = buildCreatorSnapshotFirstWeekPlan({
    connected: false,
    thinContent: true,
    cadenceInferred: false,
    typicalDays: [],
    streamTimesInferred: false,
    streamTimesLabel: null,
    primaryPlatform: null,
  });
  assert.equal(plan[0]?.title.includes("Twitch"), true);
});

test("connect ranking leads with Twitch and Kick", () => {
  assert.deepEqual(launchOAuthPlatforms, ["Twitch", "Kick"]);
  process.env.PLATFORM_OAUTH_ENABLED = "true";
  const ui = getOAuthPlatformUi();
  assert.equal(ui[0]?.platform, "Twitch");
  assert.equal(ui[1]?.platform, "Kick");
  assert.equal(ui.find((entry) => entry.platform === "YouTube")?.note, "youtube_unverified");
});
