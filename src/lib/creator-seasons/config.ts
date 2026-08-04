import type { SeasonTier, SeasonXpEventType } from "./types";

export const SEASON_XP_AMOUNTS: Record<SeasonXpEventType, number> = {
  mission_task: 25,
  mission_complete: 50,
  recommendation_complete: 30,
  coach_onboarding: 100,
};

export const SEASON_TIERS: SeasonTier[] = [
  { tier: 1, xpRequired: 0, title: "Rookie", reward: "Season 1 badge on your portal" },
  { tier: 2, xpRequired: 100, title: "Hustler", reward: "Custom portal flair color" },
  { tier: 3, xpRequired: 250, title: "Grinder", reward: "Extra daily recommendation insight" },
  { tier: 4, xpRequired: 450, title: "Streak Starter", reward: "Streak counter on your home" },
  { tier: 5, xpRequired: 700, title: "Rising Creator", reward: "Priority applicant tag" },
  { tier: 6, xpRequired: 1000, title: "Momentum", reward: "Season stats recap card" },
  { tier: 7, xpRequired: 1400, title: "Consistent", reward: "Coach goal boost tips" },
  { tier: 8, xpRequired: 1900, title: "Dedicated", reward: "Profile spotlight eligibility" },
  { tier: 9, xpRequired: 2500, title: "Pro Path", reward: "Sponsor-ready title unlock" },
  { tier: 10, xpRequired: 3200, title: "Elite", reward: "Season 1 elite badge" },
  { tier: 11, xpRequired: 4000, title: "Veteran", reward: "Early opportunity previews" },
  { tier: 12, xpRequired: 4900, title: "Challenger", reward: "Weekly boss quest access" },
  { tier: 13, xpRequired: 5900, title: "Champion", reward: "Featured creator lottery entry" },
  { tier: 14, xpRequired: 7000, title: "Legend", reward: "Permanent legacy badge" },
  { tier: 15, xpRequired: 8200, title: "Season Master", reward: "Season 1 champion flair" },
];

export function getTierForXp(totalXp: number): SeasonTier {
  let current = SEASON_TIERS[0];
  for (const tier of SEASON_TIERS) {
    if (totalXp >= tier.xpRequired) {
      current = tier;
    } else {
      break;
    }
  }
  return current;
}

export function getNextTier(totalXp: number): SeasonTier | null {
  const current = getTierForXp(totalXp);
  return SEASON_TIERS.find((tier) => tier.tier === current.tier + 1) ?? null;
}

export function getProgressToNextTier(totalXp: number): {
  percent: number;
  xpToNext: number;
  nextTier: SeasonTier | null;
} {
  const current = getTierForXp(totalXp);
  const next = getNextTier(totalXp);
  if (!next) {
    return { percent: 100, xpToNext: 0, nextTier: null };
  }

  const span = next.xpRequired - current.xpRequired;
  const earned = totalXp - current.xpRequired;
  const percent = span > 0 ? Math.min(100, Math.round((earned / span) * 100)) : 0;

  return {
    percent,
    xpToNext: Math.max(0, next.xpRequired - totalXp),
    nextTier: next,
  };
}

export function buildTierStatuses(totalXp: number) {
  const current = getTierForXp(totalXp);
  return SEASON_TIERS.map((tier) => ({
    ...tier,
    unlocked: totalXp >= tier.xpRequired,
    isCurrent: tier.tier === current.tier,
  }));
}
