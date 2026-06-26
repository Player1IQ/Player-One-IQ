import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import {
  mapContractPaymentRow,
  mapPayoutRecipientRow,
  type ContractPayment,
  type ContractPaymentRow,
  type PayoutRecipient,
  type PayoutRecipientRow,
} from "./types";

const payoutRecipientSelect = `
  *,
  creators ( name )
`;

const contractPaymentSelect = `
  *,
  payout_recipients ( label, payout_instructions ),
  creators:payee_creator_id ( name )
`;

export async function getOrgPayoutRecipient(): Promise<PayoutRecipient | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const organizationId = await getOrganizationId();
  if (!organizationId) return null;

  const { data, error } = await supabase
    .from("payout_recipients")
    .select(payoutRecipientSelect)
    .eq("organization_id", organizationId)
    .eq("recipient_type", "organization")
    .maybeSingle();

  if (error || !data) return null;
  return mapPayoutRecipientRow(data as PayoutRecipientRow);
}

export async function getCreatorPayoutRecipient(
  creatorId: string
): Promise<PayoutRecipient | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const organizationId = await getOrganizationId();
  if (!organizationId) return null;

  const { data, error } = await supabase
    .from("payout_recipients")
    .select(payoutRecipientSelect)
    .eq("organization_id", organizationId)
    .eq("recipient_type", "creator")
    .eq("creator_id", creatorId)
    .maybeSingle();

  if (error || !data) return null;
  return mapPayoutRecipientRow(data as PayoutRecipientRow);
}

export async function getPayoutRecipientsForOrg(): Promise<PayoutRecipient[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from("payout_recipients")
    .select(payoutRecipientSelect)
    .eq("organization_id", organizationId)
    .order("recipient_type", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as PayoutRecipientRow[]).map(mapPayoutRecipientRow);
}

export async function getContractPayment(
  contractId: string
): Promise<ContractPayment | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const organizationId = await getOrganizationId();
  if (!organizationId) return null;

  const { data, error } = await supabase
    .from("contract_payments")
    .select(contractPaymentSelect)
    .eq("organization_id", organizationId)
    .eq("contract_id", contractId)
    .maybeSingle();

  if (error || !data) return null;
  return mapContractPaymentRow(data as ContractPaymentRow);
}
