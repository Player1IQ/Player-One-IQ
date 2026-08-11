import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import { creatorAiRetentionCutoff } from "./types";
import {
  mapContentPlanRow,
  type ContentPlanPayload,
  type ContentPlanStatus,
  type CreatorContentPlan,
  type CreatorContentPlanRow,
} from "./plan-types";

function retentionIso(): string {
  return creatorAiRetentionCutoff().toISOString();
}

export async function createCreatorContentPlan(input: {
  userId: string;
  creatorId: string;
  conversationId?: string | null;
  periodStart: string;
  periodEnd: string;
  plan: ContentPlanPayload;
  status?: ContentPlanStatus;
}): Promise<CreatorContentPlan | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const organizationId = await getOrganizationId();
  if (!organizationId) return null;

  const { data, error } = await supabase
    .from("creator_content_plans")
    .insert({
      organization_id: organizationId,
      creator_id: input.creatorId,
      user_id: input.userId,
      conversation_id: input.conversationId ?? null,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      plan: input.plan,
      status: input.status ?? "draft",
    })
    .select("*")
    .single();

  if (error || !data) return null;
  return mapContentPlanRow(data as CreatorContentPlanRow);
}

export async function getCreatorContentPlan(
  planId: string,
  userId: string
): Promise<CreatorContentPlan | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const organizationId = await getOrganizationId();
  if (!organizationId) return null;

  const { data, error } = await supabase
    .from("creator_content_plans")
    .select("*")
    .eq("id", planId)
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .gte("created_at", retentionIso())
    .maybeSingle();

  if (error || !data) return null;
  return mapContentPlanRow(data as CreatorContentPlanRow);
}

export async function listCreatorContentPlans(
  userId: string,
  creatorId: string,
  limit = 20
): Promise<CreatorContentPlan[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from("creator_content_plans")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("creator_id", creatorId)
    .gte("created_at", retentionIso())
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as CreatorContentPlanRow[]).map(mapContentPlanRow);
}

export async function getActiveCreatorContentPlan(
  userId: string,
  creatorId: string
): Promise<CreatorContentPlan | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const organizationId = await getOrganizationId();
  if (!organizationId) return null;

  const { data, error } = await supabase
    .from("creator_content_plans")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("creator_id", creatorId)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return mapContentPlanRow(data as CreatorContentPlanRow);
}

export async function activateCreatorContentPlan(
  planId: string,
  userId: string,
  creatorId: string
): Promise<{
  plan: CreatorContentPlan;
  previousActivePlan: CreatorContentPlan | null;
} | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const organizationId = await getOrganizationId();
  if (!organizationId) return null;

  const target = await getCreatorContentPlan(planId, userId);
  if (!target || target.creatorId !== creatorId) return null;
  if (target.status !== "draft") return null;

  const previousActivePlan = await getActiveCreatorContentPlan(userId, creatorId);

  const now = new Date().toISOString();

  if (previousActivePlan) {
    const { error: archiveError } = await supabase
      .from("creator_content_plans")
      .update({ status: "archived", updated_at: now })
      .eq("id", previousActivePlan.id)
      .eq("user_id", userId)
      .eq("organization_id", organizationId);

    if (archiveError) return null;
  }

  const { data, error } = await supabase
    .from("creator_content_plans")
    .update({ status: "active", updated_at: now })
    .eq("id", planId)
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .select("*")
    .single();

  if (error || !data) return null;
  return {
    plan: mapContentPlanRow(data as CreatorContentPlanRow),
    previousActivePlan,
  };
}

export async function archiveCreatorContentPlan(
  planId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) return false;

  const organizationId = await getOrganizationId();
  if (!organizationId) return false;

  const { error } = await supabase
    .from("creator_content_plans")
    .update({
      status: "archived",
      updated_at: new Date().toISOString(),
    })
    .eq("id", planId)
    .eq("user_id", userId)
    .eq("organization_id", organizationId);

  return !error;
}
