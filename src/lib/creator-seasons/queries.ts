import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import type { CreatorSeason, CreatorSeasonProgress } from "./types";

interface SeasonRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

interface ProgressRow {
  id: string;
  season_id: string;
  total_xp: number;
  opted_in_at: string;
}

function mapSeason(row: SeasonRow): CreatorSeason {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isActive: row.is_active,
  };
}

function mapProgress(row: ProgressRow): CreatorSeasonProgress {
  return {
    id: row.id,
    seasonId: row.season_id,
    totalXp: row.total_xp,
    optedInAt: row.opted_in_at,
  };
}

export async function getActiveCreatorSeason(): Promise<CreatorSeason | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("creator_seasons")
    .select("*")
    .eq("is_active", true)
    .lte("starts_at", now)
    .gte("ends_at", now)
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return mapSeason(data as SeasonRow);
}

export async function getSeasonProgress(
  seasonId: string,
  userId: string,
  creatorId: string
): Promise<CreatorSeasonProgress | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const organizationId = await getOrganizationId();
  if (!organizationId) return null;

  const { data, error } = await supabase
    .from("creator_season_progress")
    .select("id, season_id, total_xp, opted_in_at")
    .eq("season_id", seasonId)
    .eq("user_id", userId)
    .eq("creator_id", creatorId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) return null;
  return mapProgress(data as ProgressRow);
}

export async function getRecentXpTotal(progressId: string): Promise<number> {
  const supabase = await createClient();
  if (!supabase) return 0;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data } = await supabase
    .from("creator_season_xp_events")
    .select("xp_amount")
    .eq("progress_id", progressId)
    .gte("created_at", weekAgo.toISOString());

  return (data ?? []).reduce((sum, row) => sum + row.xp_amount, 0);
}
