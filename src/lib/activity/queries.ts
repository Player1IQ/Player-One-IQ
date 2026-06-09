import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import { formatRelativeTime } from "@/lib/contracts";

export type ActivityAction = "created" | "updated" | "status_changed" | "deleted";

export interface ActivityLogRow {
  id: string;
  organization_id: string;
  entity_type: string;
  entity_id: string | null;
  action: ActivityAction;
  summary: string;
  detail: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ActivityItem {
  id: string;
  action: ActivityAction;
  summary: string;
  detail: string | null;
  entityType: string;
  entityId: string | null;
  timeAgo: string;
  createdAt: string;
}

export async function getRecentActivity(limit = 10): Promise<ActivityItem[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return (data as ActivityLogRow[]).map((row) => ({
    id: row.id,
    action: row.action,
    summary: row.summary,
    detail: row.detail,
    entityType: row.entity_type,
    entityId: row.entity_id,
    timeAgo: formatRelativeTime(row.created_at),
    createdAt: row.created_at,
  }));
}
