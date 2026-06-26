import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import { getCurrentUserMembership } from "@/lib/permissions";
import {
  isCreatorPortalRole,
  isSponsorPortalRole,
} from "@/lib/team";
import {
  formatCurrency,
  mapContractRow,
  type Contract,
  type ContractNegotiationContext,
  type ContractRow,
} from "./types";

const contractSelect = `
  *,
  creators ( name ),
  sponsors ( company_name )
`;

export async function getContracts(): Promise<Contract[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const membership = await getCurrentUserMembership();

  let query = supabase
    .from("contracts")
    .select(contractSelect)
    .eq("organization_id", organizationId);

  if (membership && isCreatorPortalRole(membership.role)) {
    if (!membership.linkedCreatorId) return [];
    query = query.eq("creator_id", membership.linkedCreatorId);
  } else if (membership && isSponsorPortalRole(membership.role)) {
    if (!membership.linkedSponsorId) return [];
    query = query.eq("sponsor_id", membership.linkedSponsorId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as ContractRow[]).map(mapContractRow);
}

export async function getContractById(id: string): Promise<Contract | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const organizationId = await getOrganizationId();
  if (!organizationId) return null;

  const membership = await getCurrentUserMembership();

  let query = supabase
    .from("contracts")
    .select(contractSelect)
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (membership && isCreatorPortalRole(membership.role)) {
    if (!membership.linkedCreatorId) return null;
    query = query.eq("creator_id", membership.linkedCreatorId);
  } else if (membership && isSponsorPortalRole(membership.role)) {
    if (!membership.linkedSponsorId) return null;
    query = query.eq("sponsor_id", membership.linkedSponsorId);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) return null;
  return mapContractRow(data as ContractRow);
}

export async function getContractNegotiationContext(
  contract: Contract
): Promise<ContractNegotiationContext | null> {
  if (!contract.sourceApplicationId) return null;

  const supabase = await createClient();
  if (!supabase) return null;

  const organizationId = await getOrganizationId();
  if (!organizationId) return null;

  const { data } = await supabase
    .from("opportunity_applications")
    .select(
      `proposed_rate, opportunities ( title, budget, organization_id )`
    )
    .eq("id", contract.sourceApplicationId)
    .maybeSingle();

  if (!data) return null;

  const opportunity = Array.isArray(data.opportunities)
    ? data.opportunities[0]
    : data.opportunities;

  if (!opportunity || opportunity.organization_id !== organizationId) {
    return null;
  }

  const proposedRate =
    data.proposed_rate !== null ? Number(data.proposed_rate) : null;
  const opportunityBudget =
    opportunity.budget !== null ? Number(opportunity.budget) : null;

  return {
    proposedRate,
    proposedRateDisplay:
      proposedRate !== null ? formatCurrency(proposedRate) : "—",
    opportunityBudget,
    opportunityBudgetDisplay:
      opportunityBudget !== null ? formatCurrency(opportunityBudget) : "—",
    opportunityTitle: opportunity.title ?? null,
  };
}
