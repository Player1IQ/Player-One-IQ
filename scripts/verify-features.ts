import assert from "node:assert/strict";
import {
  canTransitionContractStatus,
  getAllowedStatusTransitions,
  getContractStats,
  getMonthlyRevenue,
  getMonthlyRevenueSummary,
  getOverdueContracts,
  getSelectableStatuses,
  getUpcomingExpirations,
  isContractOverdue,
  isExpiringSoon,
  mapContractRow,
  type Contract,
} from "../src/lib/contracts";
import { filterSearchResults } from "../src/lib/search";
import type { SearchResult } from "../src/lib/search/queries";

function makeContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: "c1",
    organizationId: "org",
    creatorId: "cr1",
    sponsorId: "sp1",
    creatorName: "Alex",
    sponsorName: "Acme",
    contractName: "Test Deal",
    contractValue: 10000,
    valueDisplay: "$10,000",
    status: "active",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    startDateDisplay: "Jan 1, 2026",
    endDateDisplay: "Dec 31, 2026",
    deliverables: "",
    notes: "",
    sourceOpportunityId: null,
    sourceApplicationId: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// Status workflow
assert.equal(canTransitionContractStatus("draft", "negotiating"), true);
assert.equal(canTransitionContractStatus("draft", "completed"), false);
assert.equal(canTransitionContractStatus("active", "expired"), true);
assert.deepEqual(getAllowedStatusTransitions("completed"), []);

const draftStatuses = getSelectableStatuses("draft", false);
assert.ok(draftStatuses.includes("draft"));
assert.ok(draftStatuses.includes("negotiating"));
assert.equal(draftStatuses.includes("completed"), false);

// Expiration helpers
const now = new Date("2026-06-08T12:00:00Z");
const expiring = makeContract({ endDate: "2026-06-20" });
const overdue = makeContract({ endDate: "2026-05-01" });
const completed = makeContract({ status: "completed", endDate: "2026-05-01" });

assert.equal(isExpiringSoon(expiring, 45, now), true);
assert.equal(isContractOverdue(overdue, now), true);
assert.equal(isExpiringSoon(overdue, 45, now), false);
assert.equal(isContractOverdue(completed, now), false);

const stats = getContractStats([
  makeContract({ status: "draft" }),
  makeContract({ status: "active", endDate: "2026-06-20" }),
  overdue,
]);
assert.equal(stats.activeCount, 2);
assert.equal(stats.negotiatingCount, 1);
assert.equal(stats.expiringSoonCount, 1);
assert.equal(stats.overdueCount, 1);
assert.equal(getUpcomingExpirations([expiring, overdue], 45, now).length, 1);
assert.equal(getOverdueContracts([expiring, overdue], now).length, 1);

// mapContractRow with joins
const mapped = mapContractRow({
  id: "id",
  organization_id: "org",
  creator_id: "cr",
  sponsor_id: "sp",
  contract_name: "Deal",
  contract_value: 5000,
  contract_status: "active",
  start_date: "2026-01-01",
  end_date: "2026-12-31",
  deliverables: null,
  notes: null,
  source_opportunity_id: "opp1",
  source_application_id: "app1",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  creators: { name: "Creator One" },
  sponsors: { company_name: "Sponsor Co" },
});
assert.equal(mapped.creatorName, "Creator One");
assert.equal(mapped.sponsorName, "Sponsor Co");
assert.equal(mapped.sourceOpportunityId, "opp1");

// Search filter
const searchItems: SearchResult[] = [
  {
    type: "creator",
    id: "1",
    label: "Alex Streams",
    subtitle: "Twitch",
    href: "/creators/1",
  },
  {
    type: "contract",
    id: "2",
    label: "Summer Campaign",
    subtitle: "Alex × Acme · Active",
    href: "/contracts/2",
  },
];
assert.equal(filterSearchResults(searchItems, "alex").length, 2);
assert.equal(filterSearchResults(searchItems, "summer").length, 1);
assert.equal(filterSearchResults(searchItems, "sponsor").length, 0);

const manyCreators: SearchResult[] = Array.from({ length: 10 }, (_, i) => ({
  type: "creator",
  id: `c${i}`,
  label: `Creator ${i}`,
  subtitle: "Twitch",
  href: `/creators/c${i}`,
}));
const contractMatch: SearchResult = {
  type: "contract",
  id: "deal",
  label: "Summer Campaign",
  subtitle: "Alex × Acme · Active",
  href: "/contracts/deal",
};
const balanced = filterSearchResults(
  [...manyCreators, contractMatch],
  "summer"
);
assert.ok(balanced.some((item) => item.type === "contract"));

const datedRevenue = getMonthlyRevenue([
  makeContract({
    status: "active",
    contractValue: 12000,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
  }),
]);
assert.ok(datedRevenue > 0);

const undatedRevenue = getMonthlyRevenue([
  makeContract({ status: "active", contractValue: 12000, startDate: null, endDate: null }),
]);
assert.equal(undatedRevenue, 1000);

const revenueSummary = getMonthlyRevenueSummary([
  makeContract({ status: "active", contractValue: 5000 }),
]);
assert.equal(revenueSummary.activeContractCount, 1);

console.log("All feature verification checks passed.");
