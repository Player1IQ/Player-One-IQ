export const creatorPlayerOrgType = "Creator / Player" as const;

export const sponsorBrandOrgType = "Brand / Sponsor" as const;

export function isSponsorBrandOrganizationType(
  type: string | null | undefined
): boolean {
  return type === sponsorBrandOrgType;
}

export const agencyOrganizationTypes = [
  "Gaming Agency",
  "Esports Team",
  "Multi-Channel Network",
  "Talent Management Firm",
  "Other",
] as const;

export const organizationTypes = [
  creatorPlayerOrgType,
  "Creator Organization",
  ...agencyOrganizationTypes,
  "Brand / Sponsor",
] as const;

export type OrganizationType = (typeof organizationTypes)[number];

export type SignupAccountType = "creator" | "agency" | "sponsor";

export const signupAccountOptions: Array<{
  id: SignupAccountType;
  title: string;
  description: string;
}> = [
  {
    id: "creator",
    title: "Creator / Player",
    description:
      "Build your brand, connect platforms, browse deals, and apply to sponsorship opportunities.",
  },
  {
    id: "agency",
    title: "Agency / Team",
    description:
      "Manage creators, sponsors, contracts, and campaigns for your roster or organization.",
  },
  {
    id: "sponsor",
    title: "Brand / Sponsor",
    description:
      "Post opportunities, review creators, and run sponsorship campaigns.",
  },
];

export interface Organization {
  id: string;
  user_id: string;
  name: string;
  type: string;
  created_at: string;
}
