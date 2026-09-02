import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  addUtcDays,
  contractEndingWindow,
  deliverableDueWindowKeys,
  utcDateOnly,
} from "@/lib/notifications/dates";
import { creatorMatchesOpportunity } from "@/lib/opportunities/recommendations";
import { mapPreferenceRow } from "@/lib/notifications/store";
import { defaultNotificationPreferences } from "@/lib/notifications/types";
import type { Creator } from "@/lib/creators";
import type { Opportunity } from "@/lib/opportunities";

const now = new Date("2026-09-02T15:00:00.000Z");

describe("notification date windows", () => {
  it("uses UTC calendar days for due and ending windows", () => {
    assert.equal(utcDateOnly(now), "2026-09-02");
    assert.equal(addUtcDays(now, 1), "2026-09-03");
    assert.deepEqual(
      deliverableDueWindowKeys(now).map((row) => row.dueDate),
      ["2026-09-03", "2026-09-05"]
    );
    assert.equal(contractEndingWindow(now).endDate, "2026-09-09");
  });
});

describe("notification preference defaults", () => {
  it("treats a missing row as all email types on", () => {
    assert.deepEqual(mapPreferenceRow(null), defaultNotificationPreferences);
  });
});

const creator: Creator = {
  id: "creator-1",
  organizationId: "org-1",
  name: "Test Creator",
  email: "test@example.com",
  primaryPlatform: "YouTube",
  socialHandles: [{ platform: "TikTok", handle: "@test" }],
  status: "active",
  notes: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  avatarUrl: null,
  availabilityStatus: "online",
  avatarInitials: "TC",
  avatarColor: "from-violet-500 to-purple-600",
};

function makeOpportunity(platform: Opportunity["platform"]): Opportunity {
  return {
    id: "opp-1",
    organizationId: "org-2",
    sponsorId: null,
    sponsorName: "Brand",
    title: "Deal",
    description: "",
    budget: 1000,
    budgetDisplay: "$1,000",
    category: "Gaming",
    platform,
    deliverables: "",
    applicationDeadline: null,
    applicationDeadlineDisplay: "—",
    status: "open",
    marketplaceListing: false,
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    applicationCount: 0,
  };
}

describe("opportunity match emails", () => {
  it("emails creators whose primary platform matches", () => {
    assert.equal(creatorMatchesOpportunity(makeOpportunity("YouTube"), creator), true);
  });

  it("skips creators with only a weak handle match", () => {
    assert.equal(creatorMatchesOpportunity(makeOpportunity("Twitch"), creator), false);
  });
});
