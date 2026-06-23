import {
  isPathAllowedForPortalUser,
  type PortalPathContext,
} from "@/lib/portal/paths";
import type { TeamRole } from "@/lib/team";
import { runGuardMatrix } from "./helpers";

const LINKED_CREATOR = "creator-abc";
const LINKED_SPONSOR = "sponsor-xyz";
const OTHER_CREATOR = "creator-other";
const OTHER_SPONSOR = "sponsor-other";

type PortalCase = {
  role: TeamRole;
  pathname: string;
  context?: PortalPathContext;
  expected: boolean;
  label?: string;
};

const playerCases: PortalCase[] = [
  { role: "player", pathname: "/portal", expected: true },
  { role: "player", pathname: "/portal/profile", expected: true },
  { role: "player", pathname: "/contracts", expected: true },
  { role: "player", pathname: "/contracts/deal-1", expected: true },
  { role: "player", pathname: "/messages", expected: true },
  { role: "player", pathname: "/messages/thread-1", expected: true },
  {
    role: "player",
    pathname: `/creators/${LINKED_CREATOR}`,
    context: { linkedCreatorId: LINKED_CREATOR },
    expected: true,
    label: "own creator profile",
  },
  {
    role: "player",
    pathname: `/creators/${OTHER_CREATOR}`,
    context: { linkedCreatorId: LINKED_CREATOR },
    expected: false,
    label: "other creator profile",
  },
  { role: "player", pathname: "/creators", expected: false },
  { role: "player", pathname: "/campaigns", expected: false },
  { role: "player", pathname: "/campaigns/1", expected: false },
  { role: "player", pathname: "/opportunities", expected: false },
  { role: "player", pathname: "/opportunities/1", expected: false },
  { role: "player", pathname: "/team", expected: false },
  { role: "player", pathname: "/billing", expected: false },
  { role: "player", pathname: "/settings", expected: false },
  { role: "player", pathname: "/sponsors", expected: false },
  { role: "player", pathname: "/", expected: false },
];

const contentCreatorCases: PortalCase[] = [
  {
    role: "content_creator",
    pathname: "/campaigns",
    context: { linkedCreatorId: LINKED_CREATOR },
    expected: true,
  },
  {
    role: "content_creator",
    pathname: "/campaigns/42",
    context: { linkedCreatorId: LINKED_CREATOR },
    expected: true,
  },
  {
    role: "content_creator",
    pathname: "/opportunities",
    context: { linkedCreatorId: LINKED_CREATOR },
    expected: true,
  },
  {
    role: "content_creator",
    pathname: "/opportunities/applications",
    context: { linkedCreatorId: LINKED_CREATOR },
    expected: true,
  },
  {
    role: "content_creator",
    pathname: "/team",
    context: { linkedCreatorId: LINKED_CREATOR },
    expected: false,
  },
  {
    role: "content_creator",
    pathname: "/portal",
    context: { linkedCreatorId: LINKED_CREATOR },
    expected: true,
  },
];

const sponsorCases: PortalCase[] = [
  {
    role: "sponsor",
    pathname: `/sponsors/${LINKED_SPONSOR}`,
    context: { linkedSponsorId: LINKED_SPONSOR },
    expected: true,
    label: "own sponsor profile",
  },
  {
    role: "sponsor",
    pathname: `/sponsors/${OTHER_SPONSOR}`,
    context: { linkedSponsorId: LINKED_SPONSOR },
    expected: false,
    label: "other sponsor profile",
  },
  {
    role: "sponsor",
    pathname: "/sponsors",
    context: { linkedSponsorId: LINKED_SPONSOR },
    expected: false,
    label: "sponsor list blocked",
  },
  {
    role: "sponsor",
    pathname: "/campaigns",
    context: { linkedSponsorId: LINKED_SPONSOR },
    expected: true,
  },
  {
    role: "sponsor",
    pathname: "/creators",
    context: { linkedSponsorId: LINKED_SPONSOR },
    expected: false,
  },
  {
    role: "sponsor",
    pathname: `/creators/${OTHER_CREATOR}`,
    context: { linkedSponsorId: LINKED_SPONSOR },
    expected: false,
  },
  {
    role: "sponsor",
    pathname: "/opportunities",
    context: { linkedSponsorId: LINKED_SPONSOR },
    expected: false,
  },
  {
    role: "sponsor",
    pathname: "/contracts",
    context: { linkedSponsorId: LINKED_SPONSOR },
    expected: true,
  },
  {
    role: "sponsor",
    pathname: "/portal",
    context: { linkedSponsorId: LINKED_SPONSOR },
    expected: true,
  },
];

runGuardMatrix("portal player routes", playerCases, (testCase) =>
  isPathAllowedForPortalUser(
    testCase.pathname,
    testCase.role,
    testCase.context ?? { linkedCreatorId: LINKED_CREATOR }
  )
);

runGuardMatrix("portal content_creator routes", contentCreatorCases, (testCase) =>
  isPathAllowedForPortalUser(
    testCase.pathname,
    testCase.role,
    testCase.context ?? { linkedCreatorId: LINKED_CREATOR }
  )
);

runGuardMatrix("portal sponsor routes", sponsorCases, (testCase) =>
  isPathAllowedForPortalUser(
    testCase.pathname,
    testCase.role,
    testCase.context ?? { linkedSponsorId: LINKED_SPONSOR }
  )
);
