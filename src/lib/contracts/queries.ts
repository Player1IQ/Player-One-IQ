import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import { mapContractRow, type Contract, type ContractRow } from "@/lib/contracts";

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

  const { data, error } = await supabase
    .from("contracts")
    .select(contractSelect)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as ContractRow[]).map(mapContractRow);
}

export async function getContractById(id: string): Promise<Contract | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const organizationId = await getOrganizationId();
  if (!organizationId) return null;

  const { data, error } = await supabase
    .from("contracts")
    .select(contractSelect)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) return null;
  return mapContractRow(data as ContractRow);
}
