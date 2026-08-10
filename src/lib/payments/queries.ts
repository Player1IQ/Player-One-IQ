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

function monthBoundsIso(periodMonth: string): { start: string; end: string } {
  const start = new Date(`${periodMonth}T00:00:00`);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function getPaidContractPaymentsForMonth(
  periodMonth: string
): Promise<ContractPayment[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const { start, end } = monthBoundsIso(periodMonth);

  const { data, error } = await supabase
    .from("contract_payments")
    .select(contractPaymentSelect)
    .eq("organization_id", organizationId)
    .in("status", ["paid_external", "paid_platform"])
    .gte("paid_at", start)
    .lte("paid_at", end)
    .order("paid_at", { ascending: false });

  if (error || !data) return [];
  return (data as ContractPaymentRow[]).map(mapContractPaymentRow);
}

export async function getCreatorPaidContractPaymentsForMonth(
  creatorId: string,
  periodMonth: string
): Promise<ContractPayment[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const { start, end } = monthBoundsIso(periodMonth);

  const { data, error } = await supabase
    .from("contract_payments")
    .select(contractPaymentSelect)
    .eq("organization_id", organizationId)
    .eq("payee_creator_id", creatorId)
    .in("status", ["paid_external", "paid_platform"])
    .gte("paid_at", start)
    .lte("paid_at", end)
    .order("paid_at", { ascending: false });

  if (error || !data) return [];
  return (data as ContractPaymentRow[]).map(mapContractPaymentRow);
}

export async function getPaidContractPaymentsForMonths(
  monthKeys: string[]
): Promise<ContractPayment[]> {
  if (monthKeys.length === 0) return [];

  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const sortedKeys = [...monthKeys].sort();
  const { start } = monthBoundsIso(sortedKeys[0]!);
  const { end } = monthBoundsIso(sortedKeys[sortedKeys.length - 1]!);

  const { data, error } = await supabase
    .from("contract_payments")
    .select(contractPaymentSelect)
    .eq("organization_id", organizationId)
    .in("status", ["paid_external", "paid_platform"])
    .gte("paid_at", start)
    .lte("paid_at", end)
    .order("paid_at", { ascending: false });

  if (error || !data) return [];
  return (data as ContractPaymentRow[]).map(mapContractPaymentRow);
}
