export type CoachPrimaryGoal =
  | "growth"
  | "monetization"
  | "consistency"
  | "sponsorship"
  | "brand";

export const COACH_PRIMARY_GOALS: Array<{
  id: CoachPrimaryGoal;
  label: string;
  description: string;
}> = [
  {
    id: "growth",
    label: "Grow my audience",
    description: "Reach, retention, and momentum across platforms.",
  },
  {
    id: "monetization",
    label: "Make more money",
    description: "Revenue, affiliates, and monetization paths.",
  },
  {
    id: "consistency",
    label: "Stay consistent",
    description: "Posting rhythm, schedule, and follow-through.",
  },
  {
    id: "sponsorship",
    label: "Land sponsorships",
    description: "Brand deals, deliverables, and sponsor pipeline.",
  },
  {
    id: "brand",
    label: "Build my brand",
    description: "Positioning, profile, and long-term creator business.",
  },
];

export const COACH_CONTENT_FOCUS_OPTIONS = [
  "Live streaming",
  "Long-form video",
  "Short-form clips",
  "Social posts",
  "Podcasts / audio",
  "Mixed / variety",
] as const;

export const COACH_POSTING_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const COACH_MONETIZATION_OPTIONS = [
  "Subscriptions / memberships",
  "Ads",
  "Brand partnerships",
  "Affiliate revenue",
  "Merchandise",
  "Donations / tips",
  "Not monetizing yet",
] as const;

export interface CoachProfileInput {
  primaryGoal: CoachPrimaryGoal;
  contentFocus: string[];
  targetPostingDays: string[];
  monetizationInterests: string[];
  biggestChallenge?: string;
}

export interface CoachProfile {
  id: string;
  activated: boolean;
  onboardingCompleted: boolean;
  primaryGoal: CoachPrimaryGoal | null;
  contentFocus: string[];
  targetPostingDays: string[];
  monetizationInterests: string[];
  biggestChallenge: string | null;
}
