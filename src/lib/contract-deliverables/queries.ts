import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import {
  buildDeliverablesSummary,
  mapDeliverableRow,
  parseDeliverableTitlesFromText,
  type ContractDeliverable,
  type ContractDeliverableRow,
  type DeliverablesSummary,
} from "@/lib/contract-deliverables";

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
    .select("*")
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
    .select("*")
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
