import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getStaffRouteGuard,
  isPathAllowedForStaffUser,
} from "@/lib/staff/paths";
import type { TeamRole } from "@/lib/team";
import { hasReadAccess } from "@/lib/team";
import { runGuardMatrix } from "./helpers";

type StaffCase = {
  role: TeamRole;
  pathname: string;
  expected: boolean;
  label?: string;
};

const talentManagerCases: StaffCase[] = [
  { role: "talent_manager", pathname: "/sponsors", expected: true },
  { role: "talent_manager", pathname: "/sponsors/1", expected: true },
  { role: "talent_manager", pathname: "/creators", expected: true },
  { role: "talent_manager", pathname: "/team", expected: false },
  { role: "talent_manager", pathname: "/billing", expected: false },
  { role: "talent_manager", pathname: "/settings", expected: false },
];

const memberCases: StaffCase[] = [
  { role: "member", pathname: "/team", expected: true },
  { role: "member", pathname: "/creators", expected: true },
  { role: "member", pathname: "/contracts", expected: true },
  { role: "member", pathname: "/ai", expected: true },
  { role: "member", pathname: "/reports", expected: true },
  { role: "member", pathname: "/reports/print", expected: true },
  { role: "member", pathname: "/billing", expected: false },
  { role: "member", pathname: "/settings", expected: false },
];

const viewerCases: StaffCase[] = [
  { role: "viewer", pathname: "/creators", expected: true },
  { role: "viewer", pathname: "/contracts", expected: true },
  { role: "viewer", pathname: "/campaigns", expected: true },
  { role: "viewer", pathname: "/team", expected: true },
  { role: "viewer", pathname: "/ai", expected: true },
  { role: "viewer", pathname: "/reports", expected: true },
  { role: "viewer", pathname: "/reports/print", expected: true },
  { role: "viewer", pathname: "/billing", expected: false },
  { role: "viewer", pathname: "/settings", expected: false },
];

const ownerCases: StaffCase[] = [
  { role: "owner", pathname: "/billing", expected: true },
  { role: "owner", pathname: "/settings", expected: true },
  { role: "owner", pathname: "/team", expected: true },
  { role: "owner", pathname: "/ai", expected: true },
  { role: "owner", pathname: "/reports", expected: true },
];

const partnershipsCases: StaffCase[] = [
  { role: "partnerships", pathname: "/ai", expected: true },
  { role: "partnerships", pathname: "/reports", expected: true },
  { role: "partnerships", pathname: "/settings", expected: false },
];

runGuardMatrix("staff talent_manager routes", talentManagerCases, (testCase) =>
  isPathAllowedForStaffUser(testCase.pathname, testCase.role)
);

runGuardMatrix("staff member routes", memberCases, (testCase) =>
  isPathAllowedForStaffUser(testCase.pathname, testCase.role)
);

runGuardMatrix("staff viewer routes", viewerCases, (testCase) =>
  isPathAllowedForStaffUser(testCase.pathname, testCase.role)
);

runGuardMatrix("staff owner routes", ownerCases, (testCase) =>
  isPathAllowedForStaffUser(testCase.pathname, testCase.role)
);

runGuardMatrix("staff partnerships routes", partnershipsCases, (testCase) =>
  isPathAllowedForStaffUser(testCase.pathname, testCase.role)
);

test("portal roles bypass staff guards", () => {
  for (const role of ["player", "content_creator", "sponsor"] as TeamRole[]) {
    assert.equal(isPathAllowedForStaffUser("/billing", role), true);
    assert.equal(isPathAllowedForStaffUser("/team", role), true);
  }
});

test("portal roles lack ai and reports read access", () => {
  for (const role of ["player", "content_creator", "sponsor"] as TeamRole[]) {
    assert.equal(hasReadAccess(role, "ai"), false);
    assert.equal(hasReadAccess(role, "reports"), false);
  }
});

test("getStaffRouteGuard resolves nested prefixes", () => {
  assert.equal(getStaffRouteGuard("/opportunities/applications")?.key, "opportunities");
  assert.equal(getStaffRouteGuard("/team/permissions")?.key, "team");
  assert.equal(getStaffRouteGuard("/portal"), null);
  assert.equal(getStaffRouteGuard("/ai")?.key, "ai");
  assert.equal(getStaffRouteGuard("/reports")?.key, "reports");
  assert.equal(getStaffRouteGuard("/reports/print")?.key, "reports");
});
