import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatAnalyticsUpdatedLabel,
  parseCachedContentItems,
  platformNeedsReconnect,
  platformsNeedingFirstFetch,
} from "@/lib/platform-oauth/content-cache-client";

describe("platformsNeedingFirstFetch", () => {
  it("returns connected platforms that have no stored cache row", () => {
    assert.deepEqual(
      platformsNeedingFirstFetch(["Twitch", "Kick", "YouTube"], ["Twitch"]),
      ["Kick", "YouTube"]
    );
  });

  it("returns empty when every connected platform is cached", () => {
    assert.deepEqual(
      platformsNeedingFirstFetch(["Twitch"], ["Twitch", "Kick"]),
      []
    );
  });
});

describe("parseCachedContentItems", () => {
  it("keeps well-formed items and drops junk", () => {
    const items = parseCachedContentItems([
      {
        id: "vod-1",
        title: "Ranked",
        publishedAt: "2026-10-01T00:00:00.000Z",
        contentType: "stream",
        viewCount: 12,
      },
      { id: "bad" },
      null,
    ]);
    assert.equal(items.length, 1);
    assert.equal(items[0]?.id, "vod-1");
    assert.equal(items[0]?.contentType, "stream");
  });
});

describe("platformNeedsReconnect", () => {
  it("flags sync errors and missing oauth", () => {
    assert.equal(
      platformNeedsReconnect({
        connectionStatus: "sync_error",
        syncError: "scope",
        cacheError: null,
      }),
      true
    );
    assert.equal(
      platformNeedsReconnect({
        connectionStatus: "connected_oauth",
        syncError: null,
        cacheError: null,
      }),
      false
    );
  });
});

describe("formatAnalyticsUpdatedLabel", () => {
  it("returns null without a timestamp", () => {
    assert.equal(formatAnalyticsUpdatedLabel(null), null);
  });

  it("prefixes Updated for a just-now timestamp", () => {
    assert.equal(
      formatAnalyticsUpdatedLabel(new Date().toISOString()),
      "Updated just now"
    );
  });
});
