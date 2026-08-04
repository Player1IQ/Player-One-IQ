import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import {
  buildTierStatuses,
  getProgressToNextTier,
  getTierForXp,
  SEASON_XP_AMOUNTS,
} from "./config";
import {
  getActiveCreatorSeason,
  getRecentXpTotal,
  getSeasonProgress,
} from "./queries";
import type { CreatorSeasonView, SeasonXpEventType } from "./types";

function getDaysRemaining(endsAt: string): number {
  const end = new Date(endsAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
}

export async function buildCreatorSeasonView(
  userId: string,
  creatorId: string
): Promise<CreatorSeasonView | null> {
  const season = await getActiveCreatorSeason();
  if (!season) return null;

  const progress = await getSeasonProgress(season.id, userId, creatorId);
  const totalXp = progress?.totalXp ?? 0;
  const { percent, xpToNext, nextTier } = getProgressToNextTier(totalXp);
  const recentXpTotal = progress
    ? await getRecentXpTotal(progress.id)
    : 0;

  return {
    season,
    progress,
    optedIn: Boolean(progress),
    totalXp,
    currentTier: getTierForXp(totalXp),
    nextTier,
    progressToNextPercent: percent,
    xpToNextTier: xpToNext,
    daysRemaining: getDaysRemaining(season.endsAt),
    tiers: buildTierStatuses(totalXp),
    recentXpTotal,
  };
}

async function ensureSeasonProgress(
  seasonId: string,
  userId: string,
  creatorId: string,
  organizationId: string
): Promise<{ id: string; totalXp: number } | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const existing = await getSeasonProgress(seasonId, userId, creatorId);
  if (existing) {
    return { id: existing.id, totalXp: existing.totalXp };
  }

  const { data, error } = await supabase
    .from("creator_season_progress")
    .insert({
      season_id: seasonId,
      organization_id: organizationId,
      user_id: userId,
      creator_id: creatorId,
    })
    .select("id, total_xp")
    .single();

  if (error || !data) return null;
  return { id: data.id, totalXp: data.total_xp };
}

export async function optInToActiveSeason(
  userId: string,
  creatorId: string
): Promise<{ success: true } | { error: string }> {
  const season = await getActiveCreatorSeason();
  if (!season) return { error: "No active season right now." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const progress = await ensureSeasonProgress(
    season.id,
    userId,
    creatorId,
    organizationId
  );
  if (!progress) return { error: "Unable to join the season." };

  return { success: true };
}

export async function awardCreatorSeasonXp(input: {
  userId: string;
  creatorId: string;
  eventType: SeasonXpEventType;
  sourceKey: string;
  metadata?: Record<string, unknown>;
}): Promise<{ awarded: boolean; xp?: number }> {
  const season = await getActiveCreatorSeason();
  if (!season) return { awarded: false };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { awarded: false };

  const progress = await ensureSeasonProgress(
    season.id,
    input.userId,
    input.creatorId,
    organizationId
  );
  if (!progress) return { awarded: false };

  const xpAmount = SEASON_XP_AMOUNTS[input.eventType];
  const supabase = await createClient();
  if (!supabase) return { awarded: false };

  const { error: insertError } = await supabase
    .from("creator_season_xp_events")
    .insert({
      progress_id: progress.id,
      event_type: input.eventType,
      xp_amount: xpAmount,
      source_key: input.sourceKey,
      metadata: input.metadata ?? {},
    });

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: existing } = await supabase
        .from("creator_season_xp_events")
        .select("xp_amount")
        .eq("progress_id", progress.id)
        .eq("source_key", input.sourceKey)
        .maybeSingle();

      if (existing) {
        return { awarded: true, xp: existing.xp_amount };
      }
    }
    return { awarded: false };
  }

  const newTotal = progress.totalXp + xpAmount;
  const { error: updateError } = await supabase
    .from("creator_season_progress")
    .update({
      total_xp: newTotal,
      updated_at: new Date().toISOString(),
    })
    .eq("id", progress.id);

  if (updateError) {
    // Event was recorded; still credit the user if total_xp update lost a race.
    return { awarded: true, xp: xpAmount };
  }

  return { awarded: true, xp: xpAmount };
}
