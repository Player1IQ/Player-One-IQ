import assert from "node:assert/strict";
import { test } from "node:test";
import {
  filterCommandPaletteResults,
  getAccessibleActions,
  getCommandPaletteRoutes,
  scoreCommandPaletteItem,
} from "@/lib/command-palette";
import type { CommandPaletteIndex, CommandPaletteItem } from "@/lib/command-palette";
import type { FeatureKey } from "@/lib/subscription/types";

function allFeatures(): Set<FeatureKey> {
  return new Set<FeatureKey>([
    "creator_profiles",
    "sponsor_crm",
    "campaign_tracking",
    "contracts",
    "create_opportunities",
    "opportunity_management",
    "apply_opportunities",
    "messaging",
    "team_management",
    "advanced_analytics",
    "monthly_reports",
    "ai_growth",
  ]);
}

test("keyword matching routes payout to billing", () => {
  const routes = getCommandPaletteRoutes(allFeatures(), "owner");
  const billing = routes.find((route) => route.href === "/billing");
  assert.ok(billing);

  const score = scoreCommandPaletteItem(billing!, "payout");
  assert.ok(score >= 65);
});

test("keyword matching routes deal to contracts", () => {
  const routes = getCommandPaletteRoutes(allFeatures(), "owner");
  const contracts = routes.find((route) => route.href === "/contracts");
  assert.ok(contracts);

  const score = scoreCommandPaletteItem(contracts!, "deal");
  assert.ok(score >= 65);
});

test("creator portal includes revenue page", () => {
  const routes = getCommandPaletteRoutes(allFeatures(), "player");
  assert.ok(routes.some((route) => route.href === "/portal/revenue"));
});

test("role gating excludes staff create actions for portal users", () => {
  const staffActions = getAccessibleActions(allFeatures(), "owner");
  const portalActions = getAccessibleActions(allFeatures(), "player");

  assert.ok(staffActions.some((action) => action.id === "create-deal"));
  assert.ok(!portalActions.some((action) => action.id === "create-deal"));
  assert.ok(portalActions.some((action) => action.id === "view-revenue"));
});

test("sponsor portal excludes staff-only create actions", () => {
  const actions = getAccessibleActions(allFeatures(), "sponsor");

  assert.ok(!actions.some((action) => action.id === "create-campaign"));
  assert.ok(!actions.some((action) => action.id === "create-creator"));
  assert.ok(actions.some((action) => action.id === "update-company"));
});

test("filterCommandPaletteResults preserves section ordering", () => {
  const index: CommandPaletteIndex = {
    routes: [
      {
        id: "route-contracts",
        section: "route",
        label: "Deals",
        subtitle: "Page",
        href: "/contracts",
        keywords: ["deal", "contract"],
      },
    ],
    actions: [
      {
        id: "create-deal",
        section: "action",
        label: "Create deal",
        subtitle: "New sponsorship agreement",
        href: "/contracts?create=true",
        keywords: ["deal"],
      },
    ],
    entities: [
      {
        id: "contract-1",
        section: "entity",
        label: "Summer Drop",
        subtitle: "Creator × Brand · Active",
        href: "/contracts/1",
        keywords: ["deal"],
        entityType: "contract",
      },
    ],
  };

  const results = filterCommandPaletteResults(index, "deal");
  const sections = results.flat.map((item: CommandPaletteItem) => item.section);

  assert.deepEqual(sections, ["route", "action", "entity"]);
});

test("fuzzy match scores partial entity labels", () => {
  const item: CommandPaletteItem = {
    id: "campaign-1",
    section: "entity",
    label: "Holiday Launch",
    subtitle: "Acme · Active",
    href: "/campaigns/1",
    entityType: "campaign",
  };

  assert.ok(scoreCommandPaletteItem(item, "hldy") >= 30);
});
