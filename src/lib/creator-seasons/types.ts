export type SeasonXpEventType =
  | "mission_task"
  | "mission_complete"
  | "recommendation_complete"
  | "coach_onboarding";

export interface SeasonTier {
  tier: number;
  xpRequired: number;
  title: string;
  reward: string;
}

export interface CreatorSeason {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

export interface CreatorSeasonProgress {
  id: string;
  seasonId: string;
  totalXp: number;
  optedInAt: string;
}

export interface CreatorSeasonTierStatus extends SeasonTier {
  unlocked: boolean;
  isCurrent: boolean;
}

export interface CreatorSeasonView {
  season: CreatorSeason;
  progress: CreatorSeasonProgress | null;
  optedIn: boolean;
  totalXp: number;
  currentTier: SeasonTier;
  nextTier: SeasonTier | null;
  progressToNextPercent: number;
  xpToNextTier: number;
  daysRemaining: number;
  tiers: CreatorSeasonTierStatus[];
  recentXpTotal: number;
}
