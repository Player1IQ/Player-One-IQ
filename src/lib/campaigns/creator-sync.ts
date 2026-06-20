import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import { getCurrentUserMembership } from "@/lib/permissions";
import { isPortalRole } from "@/lib/team";
import {
  mapCampaignCreatorRow,
  type CampaignCreatorAssignment,
  type CampaignCreatorRow,
} from "@/lib/campaigns/assignments";

type SupabaseClient = NonNullable<Awaited<ReturnType<typeof createClient>>>;

export async function getCampaignIdsForCreator(
  creatorId: string
): Promise<string[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from("sponsor_campaign_creators")
    .select("campaign_id")
    .eq("organization_id", organizationId)
    .eq("creator_id", creatorId);

  if (error || !data) return [];
  return data.map((row) => row.campaign_id);
}

export async function getCampaignCreators(
  campaignId: string
): Promise<CampaignCreatorAssignment[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from("sponsor_campaign_creators")
    .select("campaign_id, creator_id, organization_id, creators ( name )")
    .eq("organization_id", organizationId)
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as CampaignCreatorRow[]).map(mapCampaignCreatorRow);
}

export async function isCreatorAssignedToCampaign(
  campaignId: string,
  creatorId: string
): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) return false;

  const organizationId = await getOrganizationId();
  if (!organizationId) return false;

  const { data } = await supabase
    .from("sponsor_campaign_creators")
    .select("campaign_id")
    .eq("organization_id", organizationId)
    .eq("campaign_id", campaignId)
    .eq("creator_id", creatorId)
    .maybeSingle();

  return Boolean(data);
}

export async function syncInferredCampaignCreators(
  supabase: SupabaseClient,
  organizationId: string,
  campaignId: string,
  sponsorId: string,
  relatedOpportunityId: string | null
): Promise<void> {
  const creatorIds = new Set<string>();

  if (relatedOpportunityId) {
    const { data: applications } = await supabase
      .from("opportunity_applications")
      .select("creator_id")
      .eq("opportunity_id", relatedOpportunityId);

    for (const row of applications ?? []) {
      if (row.creator_id) creatorIds.add(row.creator_id);
    }
  }

  const { data: contracts } = await supabase
    .from("contracts")
    .select("creator_id")
    .eq("organization_id", organizationId)
    .eq("sponsor_id", sponsorId)
    .in("contract_status", ["draft", "negotiating", "active", "completed"]);

  for (const row of contracts ?? []) {
    if (row.creator_id) creatorIds.add(row.creator_id);
  }

  if (creatorIds.size === 0) return;

  await supabase.from("sponsor_campaign_creators").upsert(
    [...creatorIds].map((creatorId) => ({
      campaign_id: campaignId,
      creator_id: creatorId,
      organization_id: organizationId,
    })),
    { onConflict: "campaign_id,creator_id" }
  );
}

export async function getPortalCampaignFilter(): Promise<string[] | null> {
  const membership = await getCurrentUserMembership();
  if (!membership || !isPortalRole(membership.role)) return null;
  if (membership.role !== "content_creator" || !membership.linkedCreatorId) {
    return [];
  }

  return getCampaignIdsForCreator(membership.linkedCreatorId);
}
