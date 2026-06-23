import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import {
  buildDeliverablesSummary,
  getDeliverableStats,
  mapDeliverableRow,
  parseDeliverableTitlesFromText,
  type ContractDeliverable,
  type ContractDeliverableRow,
  type DeliverablesSummary,
  type DeliverableDisplayStatus,
} from "@/lib/contract-deliverables";

const deliverableSelect = "*, sponsor_campaigns ( name )";

export interface LinkedDeliverableSummary {
  id: string;
  title: string;
  displayStatus: DeliverableDisplayStatus;
  dueDateDisplay: string;
  contractId: string;
  contractName: string;
  creatorName: string;
}

export interface PortalDeliverableMetrics {
  openCount: number;
  overdueCount: number;
  nextDue: ContractDeliverable | null;
}

async function seedDeliverablesFromContractText(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  contractId: string,
  organizationId: string,
  text: string
): Promise<ContractDeliverable[]> {
  const titles = parseDeliverableTitlesFromText(text);
  if (titles.length === 0) return [];

  const rows = titles.map((title, index) => ({
    organization_id: organizationId,
    contract_id: contractId,
    title,
    status: "pending" as const,
    sort_order: index,
  }));

  const { data, error } = await supabase
    .from("contract_deliverables")
    .insert(rows)
    .select("*");

  if (error || !data) return [];
  return (data as ContractDeliverableRow[])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(mapDeliverableRow);
}

export async function getDeliverablesForContract(
  contractId: string
): Promise<ContractDeliverable[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from("contract_deliverables")
    .select(deliverableSelect)
    .eq("contract_id", contractId)
    .eq("organization_id", organizationId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return [];

  if (data && data.length > 0) {
    return (data as ContractDeliverableRow[]).map(mapDeliverableRow);
  }

  const { data: contract } = await supabase
    .from("contracts")
    .select("deliverables")
    .eq("id", contractId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!contract?.deliverables?.trim()) return [];

  return seedDeliverablesFromContractText(
    supabase,
    contractId,
    organizationId,
    contract.deliverables
  );
}

export async function getDeliverablesSummariesForContracts(
  contractIds: string[]
): Promise<Record<string, DeliverablesSummary>> {
  if (contractIds.length === 0) return {};

  const supabase = await createClient();
  if (!supabase) return {};

  const organizationId = await getOrganizationId();
  if (!organizationId) return {};

  const { data, error } = await supabase
    .from("contract_deliverables")
    .select(deliverableSelect)
    .eq("organization_id", organizationId)
    .in("contract_id", contractIds)
    .order("sort_order", { ascending: true });

  if (error || !data) return {};

  const byContract = new Map<string, ContractDeliverable[]>();
  for (const row of data as ContractDeliverableRow[]) {
    const mapped = mapDeliverableRow(row);
    const list = byContract.get(mapped.contractId) ?? [];
    list.push(mapped);
    byContract.set(mapped.contractId, list);
  }

  const summaries: Record<string, DeliverablesSummary> = {};
  for (const contractId of contractIds) {
    const items = byContract.get(contractId) ?? [];
    if (items.length > 0) {
      summaries[contractId] = buildDeliverablesSummary(items);
    }
  }

  return summaries;
}

export async function getPortalDeliverableMetrics(
  creatorId: string
): Promise<PortalDeliverableMetrics> {
  const empty: PortalDeliverableMetrics = {
    openCount: 0,
    overdueCount: 0,
    nextDue: null,
  };

  const supabase = await createClient();
  if (!supabase) return empty;

  const organizationId = await getOrganizationId();
  if (!organizationId) return empty;

  const { data: contracts, error: contractsError } = await supabase
    .from("contracts")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("creator_id", creatorId);

  if (contractsError || !contracts?.length) return empty;

  const contractIds = contracts.map((c) => c.id);

  const { data, error } = await supabase
    .from("contract_deliverables")
    .select(deliverableSelect)
    .eq("organization_id", organizationId)
    .in("contract_id", contractIds);

  if (error || !data) return empty;

  const deliverables = (data as ContractDeliverableRow[]).map(mapDeliverableRow);
  const stats = getDeliverableStats(deliverables);
  const summary = buildDeliverablesSummary(deliverables);

  return {
    openCount: stats.openCount,
    overdueCount: stats.overdueCount,
    nextDue: summary.nextDue,
  };
}

export async function getLinkedDeliverablesForCampaign(
  campaignId: string
): Promise<LinkedDeliverableSummary[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from("contract_deliverables")
    .select(
      `${deliverableSelect}, contracts ( contract_name, creators ( name ) )`
    )
    .eq("organization_id", organizationId)
    .eq("campaign_id", campaignId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return (data as Array<
    ContractDeliverableRow & {
      contracts: {
        contract_name: string;
        creators: { name: string } | null;
      } | null;
    }
  >).map((row) => {
    const deliverable = mapDeliverableRow(row);
    return {
      id: deliverable.id,
      title: deliverable.title,
      displayStatus: deliverable.displayStatus,
      dueDateDisplay: deliverable.dueDateDisplay,
      contractId: deliverable.contractId,
      contractName: row.contracts?.contract_name ?? "Contract",
      creatorName: row.contracts?.creators?.name ?? "Creator",
    };
  });
}
