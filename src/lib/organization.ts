export const organizationTypes = [
  "Gaming Agency",
  "Creator Organization",
  "Esports Team",
  "Brand / Sponsor",
  "Multi-Channel Network",
  "Talent Management Firm",
  "Other",
] as const;

export type OrganizationType = (typeof organizationTypes)[number];

export interface Organization {
  id: string;
  user_id: string;
  name: string;
  type: string;
  created_at: string;
}
