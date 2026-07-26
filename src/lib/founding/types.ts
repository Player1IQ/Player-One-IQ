export type FoundingApplicantType = "creator" | "organization";

export type FoundingApplicationStatus =
  | "pending"
  | "reviewing"
  | "accepted"
  | "waitlisted"
  | "declined";

export const REVENUE_SOURCE_OPTIONS = [
  "Not yet",
  "Subscriptions / Ads",
  "Brand Partnerships",
  "Affiliate Revenue",
  "Merchandise",
  "Donations",
  "Other",
] as const;

export type RevenueSource = (typeof REVENUE_SOURCE_OPTIONS)[number];

export interface FoundingApplicationInput {
  applicantType: FoundingApplicantType;
  name: string;
  creatorHandle?: string;
  email: string;
  primaryPlatform?: string;
  otherPlatforms?: string;
  channelLinks?: string;
  contentType?: string;
  revenueSources: RevenueSource[];
  biggestManagementProblem: string;
  whyJoin: string;
  nominatedBy?: string;
}
