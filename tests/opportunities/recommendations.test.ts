import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Creator } from "@/lib/creators";
import type { Opportunity } from "@/lib/opportunities";
import { getRecommendedOpportunitiesForCreator } from "@/lib/opportunities/recommendations";

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
  availabilityStatus: "available",
  avatarInitials: "TC",
  avatarColor: "from-violet-500 to-purple-600",
};

function makeOpportunity(
  id: string,
  platform: Opportunity["platform"],
  overrides: Partial<Opportunity> = {}
): Opportunity {
  return {
    id,
    organizationId: "org-2",
    sponsorId: null,
    sponsorName: "Brand",
    title: `Opportunity ${id}`,
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
    ...overrides,
  };
}

describe("getRecommendedOpportunitiesForCreator", () => {
  it("prioritizes primary platform and excludes applied opportunities", () => {
    const opportunities = [
      makeOpportunity("1", "Instagram"),
      makeOpportunity("2", "YouTube", { marketplaceListing: true }),
      makeOpportunity("3", "TikTok"),
    ];

    const recommended = getRecommendedOpportunitiesForCreator(
      opportunities,
      new Set(["3"]),
      creator,
      2
    );

    assert.deepEqual(
      recommended.map((item) => item.id),
      ["2", "1"]
    );
  });
});
