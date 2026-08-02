import assert from "node:assert/strict";
import { test } from "node:test";
import type { Contract } from "@/lib/contracts/types";
import { countActiveDeals, isActiveDealStatus } from "@/lib/contracts/deal-metrics";

function contract(status: Contract["status"]): Contract {
  return {
    id: "deal-1",
    organizationId: "org-1",
    creatorId: "creator-1",
    sponsorId: "sponsor-1",
    contractName: "Test deal",
    sponsorName: "Sponsor",
    creatorName: "Creator",
    status,
    contractValue: 1000,
    valueDisplay: "$1,000",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    startDateDisplay: "Jan 1, 2026",
    endDateDisplay: "Dec 31, 2026",
    notes: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

test("isActiveDealStatus treats active and negotiating as pipeline deals", () => {
  assert.equal(isActiveDealStatus("active"), true);
  assert.equal(isActiveDealStatus("negotiating"), true);
  assert.equal(isActiveDealStatus("draft"), false);
});

test("countActiveDeals excludes draft deals", () => {
  assert.equal(
    countActiveDeals([
      contract("draft"),
      contract("active"),
      contract("negotiating"),
      contract("completed"),
    ]),
    2
  );
});
