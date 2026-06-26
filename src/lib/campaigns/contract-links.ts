import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import { getCurrentUserMembership } from "@/lib/permissions";
import { isCreatorPortalRole, isSponsorPortalRole } from "@/lib/team";
import {
  mapContractRow,
  type Contract,
  type ContractRow,
  type ContractStatus,
} from "../contracts/types";
import {
  mapCampaignRow,
  type SponsorCampaignRow,
  type CampaignStatus,
} from "./types";
import { getCampaignById } from "@/lib/campaigns/queries";
import { getCampaignCreators } from "@/lib/campaigns/creator-sync";

export interface RelatedContractSummary {
  id: string;
  contractName: string;
  creatorName: string;
  valueDisplay: string;
  status: ContractStatus;
}

export interface RelatedCampaignSummary {
  id: string;
  name: string;
  sponsorName: string;
  budgetDisplay: string;
  status: CampaignStatus;
}

export async function getContractsForCampaign(
  campaignId: string
): Promise<RelatedContractSummary[]> {
  const campaign = await getCampaignById(campaignId);
  if (!campaign) return [];

  const assignments = await getCampaignCreators(campaignId);
  const creatorIds = assignments.map((assignment) => assignment.creatorId);
  if (creatorIds.length === 0) return [];

  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const membership = await getCurrentUserMembership();

  let query = supabase
    .from("contracts")
    .select("*, creators ( name ), sponsors ( company_name )")
    .eq("organization_id", organizationId)
    .eq("sponsor_id", campaign.sponsorId)
    .in("creator_id", creatorIds);

  if (membership && isPortalRole(membership.role)) {
    if (!membership.linkedCreatorId) return [];
    if (!creatorIds.includes(membership.linkedCreatorId)) return [];
    query = query.eq("creator_id", membership.linkedCreatorId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as ContractRow[]).map((row) => {
    const contract = mapContractRow(row);
    return {
      id: contract.id,
      contractName: contract.contractName,
      creatorName: contract.creatorName,
      valueDisplay: contract.valueDisplay,
      status: contract.status,
    };
  });
}

export async function getCampaignsForContract(
  contract: Contract
): Promise<RelatedCampaignSummary[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const membership = await getCurrentUserMembership();

  if (membership && isCreatorPortalRole(membership.role)) {
    if (!membership.linkedCreatorId) return [];
    if (membership.linkedCreatorId !== contract.creatorId) return [];
  }

  if (membership && isSponsorPortalRole(membership.role)) {
    if (!membership.linkedSponsorId) return [];
    if (membership.linkedSponsorId !== contract.sponsorId) return [];
  }

  const { data: assignmentRows, error: assignmentError } = await supabase
    .from("sponsor_campaign_creators")
    .select("campaign_id")
    .eq("organization_id", organizationId)
    .eq("creator_id", contract.creatorId);

  if (assignmentError || !assignmentRows?.length) return [];

  const campaignIds = assignmentRows.map((row) => row.campaign_id);

  const { data, error } = await supabase
    .from("sponsor_campaigns")
    .select("*, sponsors ( company_name ), opportunities ( title )")
    .eq("organization_id", organizationId)
    .eq("sponsor_id", contract.sponsorId)
    .in("id", campaignIds)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as SponsorCampaignRow[]).map((row) => {
    const campaign = mapCampaignRow(row);
    return {
      id: campaign.id,
      name: campaign.name,
      sponsorName: campaign.sponsorName,
      budgetDisplay: campaign.budgetDisplay,
      status: campaign.status,
    };
  });
}
