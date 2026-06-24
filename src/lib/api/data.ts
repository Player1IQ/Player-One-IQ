import { createServiceClient } from "@/lib/supabase/admin";
import {
  mapCampaignRow,
  type SponsorCampaign,
  type SponsorCampaignRow,
} from "@/lib/campaigns";
import {
  mapContractRow,
  type Contract,
  type ContractRow,
} from "@/lib/contracts";
import { mapCreatorRow, type Creator, type CreatorRow } from "@/lib/creators";
import { mapSponsorRow, type Sponsor, type SponsorRow } from "@/lib/sponsors";

const contractSelect = `
  *,
  creators ( name ),
  sponsors ( company_name )
`;

const campaignSelect = `
  *,
  sponsors ( company_name ),
  opportunities ( title )
`;

function getServiceClient() {
  return createServiceClient();
}

export async function listCreatorsForOrganization(
  organizationId: string
): Promise<Creator[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("creators")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as CreatorRow[]).map(mapCreatorRow);
}

export async function getCreatorForOrganization(
  organizationId: string,
  creatorId: string
): Promise<Creator | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("creators")
    .select("*")
    .eq("id", creatorId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) return null;
  return mapCreatorRow(data as CreatorRow);
}

export async function listContractsForOrganization(
  organizationId: string
): Promise<Contract[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("contracts")
    .select(contractSelect)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as ContractRow[]).map(mapContractRow);
}

export async function listSponsorsForOrganization(
  organizationId: string
): Promise<Sponsor[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("sponsors")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as SponsorRow[]).map(mapSponsorRow);
}

export async function listCampaignsForOrganization(
  organizationId: string
): Promise<SponsorCampaign[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("sponsor_campaigns")
    .select(campaignSelect)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as SponsorCampaignRow[]).map(mapCampaignRow);
}
