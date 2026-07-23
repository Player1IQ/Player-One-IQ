import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import {
  getCurrentPeriodMonth,
  mapPlatformAccountRow,
  mapRevenueEntryRow,
  STALE_PENDING_OAUTH_MS,
  type CreatorPlatformAccount,
  type CreatorRevenueEntry,
} from "@/lib/creator-revenue";

export async function getCreatorPlatformAccounts(
  creatorId: string
): Promise<CreatorPlatformAccount[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const staleCutoff = new Date(Date.now() - STALE_PENDING_OAUTH_MS).toISOString();
  await supabase
    .from("creator_platform_accounts")
    .update({
      connection_status: "disconnected",
      sync_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId)
    .eq("creator_id", creatorId)
    .eq("connection_status", "pending_oauth")
    .lt("updated_at", staleCutoff);

  const { data, error } = await supabase
    .from("creator_platform_accounts")
    .select(
      "id, organization_id, creator_id, platform, account_handle, display_name, connection_method, connection_status, last_synced_at, sync_error, created_at, updated_at"
    )
    .eq("organization_id", organizationId)
    .eq("creator_id", creatorId)
    .neq("connection_status", "disconnected")
    .order("platform", { ascending: true });

  if (error || !data) return [];
  return data.map(mapPlatformAccountRow);
}

export async function getCreatorRevenueEntries(
  creatorId: string,
  periodMonth = getCurrentPeriodMonth()
): Promise<CreatorRevenueEntry[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from("creator_revenue_entries")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("creator_id", creatorId)
    .eq("period_month", periodMonth)
    .order("platform", { ascending: true });

  if (error || !data) return [];
  return data.map(mapRevenueEntryRow);
}

export async function getOrganizationRevenueEntries(
  periodMonth = getCurrentPeriodMonth()
): Promise<CreatorRevenueEntry[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from("creator_revenue_entries")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("period_month", periodMonth);

  if (error || !data) return [];
  return data.map(mapRevenueEntryRow);
}

export async function getOrganizationRevenueEntriesForMonths(
  monthKeys: string[]
): Promise<CreatorRevenueEntry[]> {
  if (monthKeys.length === 0) return [];

  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from("creator_revenue_entries")
    .select("*")
    .eq("organization_id", organizationId)
    .in("period_month", monthKeys);

  if (error || !data) return [];
  return data.map(mapRevenueEntryRow);
}

export async function getConnectedPlatformAccountCount(): Promise<number> {
  const supabase = await createClient();
  if (!supabase) return 0;

  const organizationId = await getOrganizationId();
  if (!organizationId) return 0;

  const { count, error } = await supabase
    .from("creator_platform_accounts")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .in("connection_status", ["connected_manual", "connected_oauth"]);

  if (error) return 0;
  return count ?? 0;
}
