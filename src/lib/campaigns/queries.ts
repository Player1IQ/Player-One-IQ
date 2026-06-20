import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import { getPortalCampaignFilter } from "@/lib/campaigns/creator-sync";
import {
  mapCampaignRow,
  type SponsorCampaign,
  type SponsorCampaignRow,
} from "@/lib/campaigns";

const campaignSelect = `
  *,
  sponsors ( company_name ),
  opportunities ( title )
`;

export async function getCampaigns(): Promise<SponsorCampaign[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const portalCampaignIds = await getPortalCampaignFilter();
  if (portalCampaignIds && portalCampaignIds.length === 0) return [];

  let query = supabase
    .from("sponsor_campaigns")
    .select(campaignSelect)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (portalCampaignIds) {
    query = query.in("id", portalCampaignIds);
  }

  const { data, error } = await query;

  if (error || !data) return [];
  return (data as SponsorCampaignRow[]).map(mapCampaignRow);
}

export async function getCampaignById(id: string): Promise<SponsorCampaign | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const organizationId = await getOrganizationId();
  if (!organizationId) return null;

  const portalCampaignIds = await getPortalCampaignFilter();
  if (portalCampaignIds && !portalCampaignIds.includes(id)) return null;

  const { data, error } = await supabase
    .from("sponsor_campaigns")
    .select(campaignSelect)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) return null;
  return mapCampaignRow(data as SponsorCampaignRow);
}

export async function getCampaignsBySponsor(
  sponsorId: string
): Promise<SponsorCampaign[]> {
  const campaigns = await getCampaigns();
  return campaigns.filter((campaign) => campaign.sponsorId === sponsorId);
}
