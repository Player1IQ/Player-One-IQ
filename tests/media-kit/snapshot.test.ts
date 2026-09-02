import assert from "node:assert/strict";
import { test } from "node:test";
import type { Creator } from "@/lib/creators";
import type { PlatformContentSnapshot } from "@/lib/platform-oauth/content-performance";
import {
  buildMediaKitSnapshot,
  collectPastPartnerNames,
  overlayMediaKitIdentity,
  selectKitHighlights,
} from "@/lib/media-kit/snapshot";
import { createMediaKitToken, isMediaKitToken } from "@/lib/media-kit/token";

const creator: Creator = {
  id: "creator-1",
  organizationId: "org-1",
  name: "Ada Stream",
  email: "ada@example.com",
  primaryPlatform: "YouTube",
  socialHandles: [
    { platform: "YouTube", handle: "@ada" },
    { platform: "Twitch", handle: "ada_live" },
  ],
  status: "active",
  notes: "INTERNAL: rate card $12k, do not share",
  createdAt: "2024-01-01T00:00:00.000Z",
  avatarUrl: null,
  availabilityStatus: "online",
  avatarInitials: "AS",
  avatarColor: "from-violet-500 to-purple-600",
};

test("past partners are unique company names from active and completed deals only", () => {
  const names = collectPastPartnerNames(
    [
      { creatorId: "creator-1", status: "active", sponsorName: "Acme Games" },
      { creatorId: "creator-1", status: "completed", sponsorName: "acme games" },
      { creatorId: "creator-1", status: "draft", sponsorName: "Draft Co" },
      { creatorId: "creator-1", status: "negotiating", sponsorName: "Hidden Brand" },
      { creatorId: "creator-1", status: "completed", sponsorName: "Unknown" },
      { creatorId: "creator-1", status: "completed", sponsorName: "  " },
      { creatorId: "other", status: "completed", sponsorName: "Other Org" },
      { creatorId: "creator-1", status: "completed", sponsorName: "Pixel Soda" },
    ],
    "creator-1"
  );

  assert.deepEqual(names, ["Acme Games", "Pixel Soda"]);
});

test("highlights keep the highest-view OAuth items and skip disconnected platforms", () => {
  const snapshots: PlatformContentSnapshot[] = [
    {
      platform: "YouTube",
      connectedViaOAuth: true,
      items: [
        {
          id: "yt-low",
          title: "Low",
          publishedAt: "2026-01-01T00:00:00.000Z",
          contentType: "video",
          viewCount: 10,
        },
        {
          id: "yt-high",
          title: "High",
          publishedAt: "2026-01-02T00:00:00.000Z",
          contentType: "video",
          viewCount: 900,
        },
      ],
    },
    {
      platform: "TikTok",
      connectedViaOAuth: false,
      items: [
        {
          id: "tt-secret",
          title: "Should not appear",
          publishedAt: "2026-01-03T00:00:00.000Z",
          contentType: "video",
          viewCount: 99999,
        },
      ],
    },
    {
      platform: "Twitch",
      connectedViaOAuth: true,
      items: [
        {
          id: "tw-mid",
          title: "Mid",
          publishedAt: "2026-01-04T00:00:00.000Z",
          contentType: "stream",
          viewCount: 400,
        },
      ],
    },
  ];

  const highlights = selectKitHighlights(snapshots, 2);
  assert.deepEqual(
    highlights.map((item) => item.id),
    ["yt-high", "tw-mid"]
  );
});

test("snapshot includes kit bio and partner names, never notes or contract dollars", () => {
  const snapshot = buildMediaKitSnapshot({
    creator,
    kitBio: " Variety streamer for cozy and competitive.",
    organizationName: "Player One IQ",
    analytics: {
      platformBreakdown: [
        {
          platform: "YouTube",
          contentCount: 2,
          totalViews: 910,
          avgViews: 455,
          totalEngagement: 12,
          audienceSize: 12000,
          connectedViaOAuth: true,
        },
      ],
      contentTrend: [],
      weeklyViewsTrend: [],
      totalViews: 910,
      totalContent: 2,
      hasOAuthContent: true,
      connectedOAuthCount: 1,
    },
    contentSnapshots: [
      {
        platform: "YouTube",
        connectedViaOAuth: true,
        items: [
          {
            id: "yt-1",
            title: "Launch",
            publishedAt: "2026-01-01T00:00:00.000Z",
            contentType: "video",
            viewCount: 910,
          },
        ],
      },
    ],
    contracts: [
      { creatorId: "creator-1", status: "active", sponsorName: "Acme Games" },
    ],
  });

  const serialized = JSON.stringify(snapshot);
  assert.equal(snapshot.kitBio, "Variety streamer for cozy and competitive.");
  assert.deepEqual(snapshot.pastPartners, ["Acme Games"]);
  assert.equal(snapshot.email, "ada@example.com");
  assert.equal(serialized.includes("INTERNAL"), false);
  assert.equal(serialized.includes("rate card"), false);
  assert.equal(serialized.includes("contractValue"), false);
  assert.equal(serialized.includes("valueDisplay"), false);
  assert.equal(serialized.includes("$12k"), false);
});

test("overlaying identity updates bio and partners without dropping highlights", () => {
  const snapshot = buildMediaKitSnapshot({
    creator,
    kitBio: "Old bio",
    organizationName: "Player One IQ",
    analytics: {
      platformBreakdown: [],
      contentTrend: [],
      weeklyViewsTrend: [],
      totalViews: 50,
      totalContent: 1,
      hasOAuthContent: true,
      connectedOAuthCount: 1,
    },
    contentSnapshots: [
      {
        platform: "YouTube",
        connectedViaOAuth: true,
        items: [
          {
            id: "keep-me",
            title: "Keep",
            publishedAt: "2026-01-01T00:00:00.000Z",
            contentType: "video",
            viewCount: 50,
          },
        ],
      },
    ],
    contracts: [],
  });

  const next = overlayMediaKitIdentity(snapshot, {
    creator: { ...creator, email: "new@example.com" },
    kitBio: "New public bio",
    organizationName: "Player One IQ",
    contracts: [
      { creatorId: "creator-1", status: "completed", sponsorName: "Pixel Soda" },
    ],
  });

  assert.equal(next.kitBio, "New public bio");
  assert.equal(next.email, "new@example.com");
  assert.deepEqual(next.pastPartners, ["Pixel Soda"]);
  assert.equal(next.highlights[0]?.id, "keep-me");
});

test("media kit tokens are unguessable base64url strings", () => {
  const token = createMediaKitToken();
  assert.equal(isMediaKitToken(token), true);
  assert.equal(isMediaKitToken("abc"), false);
  assert.equal(isMediaKitToken("../secret"), false);
});
