import assert from "node:assert/strict";
import { test } from "node:test";
import { computeProfileReadiness } from "@/lib/creators/portal-benefits";
import type { Creator } from "@/lib/creators";

const baseCreator: Creator = {
  id: "creator-1",
  organizationId: "org-1",
  name: "Test Creator",
  email: null,
  primaryPlatform: "YouTube",
  socialHandles: [],
  status: "active",
  notes: null,
  createdAt: "2025-01-01T00:00:00.000Z",
  avatarUrl: null,
  availabilityStatus: "available",
  avatarInitials: "TC",
  avatarColor: "from-violet-500 to-purple-600",
};

test("computeProfileReadiness scores zero when nothing is complete", () => {
  const readiness = computeProfileReadiness({
    creatorId: baseCreator.id,
    creator: baseCreator,
    connectedPlatformCount: 0,
    applicationCount: 0,
    openDeliverableCount: 0,
    marketplaceCount: 3,
  });

  assert.equal(readiness.items.length, 4);
  assert.equal(readiness.score, 0);
  assert.equal(
    readiness.items.some((item) => item.id === "apply_opportunity"),
    false
  );
  assert.equal(
    readiness.items.some((item) => item.id === "complete_deliverable"),
    false
  );
});

test("computeProfileReadiness reaches 100 when all applicable items are done", () => {
  const readiness = computeProfileReadiness({
    creatorId: baseCreator.id,
    creator: {
      ...baseCreator,
      email: "creator@example.com",
    },
    connectedPlatformCount: 2,
    applicationCount: 1,
    openDeliverableCount: 0,
    marketplaceCount: 5,
    hasScheduleBlock: true,
  });

  assert.equal(readiness.score, 100);
  assert.equal(
    readiness.items.every((item) => item.done),
    true
  );
});

test("computeProfileReadiness includes deliverable item when work is open", () => {
  const readiness = computeProfileReadiness({
    creatorId: baseCreator.id,
    creator: {
      ...baseCreator,
      socialHandles: [{ platform: "Twitch", handle: "@creator" }],
    },
    connectedPlatformCount: 1,
    applicationCount: 2,
    openDeliverableCount: 3,
    marketplaceCount: 0,
  });

  const deliverableItem = readiness.items.find(
    (item) => item.id === "complete_deliverable"
  );
  assert.ok(deliverableItem);
  assert.equal(deliverableItem.done, false);
  assert.equal(deliverableItem.href, "/contracts");
  assert.equal(readiness.score, 60);
});

test("computeProfileReadiness marks marketplace browse done when no listings exist", () => {
  const readiness = computeProfileReadiness({
    creatorId: baseCreator.id,
    creator: baseCreator,
    connectedPlatformCount: 0,
    applicationCount: 0,
    openDeliverableCount: 0,
    marketplaceCount: 0,
  });

  const browseItem = readiness.items.find(
    (item) => item.id === "browse_marketplace"
  );
  assert.ok(browseItem);
  assert.equal(browseItem.done, true);
});
