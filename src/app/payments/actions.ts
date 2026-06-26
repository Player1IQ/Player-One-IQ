"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import {
  getCurrentUserMembership,
  hasFullAccess,
  requireResourceWriteAccess,
} from "@/lib/permissions";
import { isCreatorPortalRole, isSponsorPortalRole } from "@/lib/team";
import {
  deriveInitialPaymentStatus,
  derivePayeeFromContract,
  parseContractValueToCents,
  canRecordExternalPayment,
} from "@/lib/payments/helpers";

export async function savePayoutRecipient(input: {
  payoutInstructions: string;
  label?: string;
}) {
  const permError = await requireResourceWriteAccess("contracts");
  if (permError) return permError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const instructions = input.payoutInstructions.trim();
  const label = input.label?.trim() || "Primary";

  const { data: existing } = await supabase
    .from("payout_recipients")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("recipient_type", "organization")
    .maybeSingle();

  const payload = {
    organization_id: organizationId,
    recipient_type: "organization" as const,
    creator_id: null,
    label,
    payout_instructions: instructions || null,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase
      .from("payout_recipients")
      .update(payload)
      .eq("id", existing.id)
      .eq("organization_id", organizationId);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("payout_recipients").insert({
      ...payload,
      created_by: user.id,
    });

    if (error) return { error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function saveCreatorPayoutRecipient(input: {
  creatorId: string;
  payoutInstructions: string;
  label?: string;
}) {
  const membership = await getCurrentUserMembership();
  if (!membership) {
    return { error: "You do not have permission to modify payout settings." };
  }

  const isOwnCreatorPortal =
    isCreatorPortalRole(membership.role) &&
    membership.linkedCreatorId === input.creatorId;

  if (!isOwnCreatorPortal) {
    const permError = await requireResourceWriteAccess("contracts");
    if (permError) return permError;
  }

  if (!input.creatorId) {
    return { error: "Creator is required." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { data: creator } = await supabase
    .from("creators")
    .select("id")
    .eq("id", input.creatorId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!creator) return { error: "Creator not found in your organization." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const instructions = input.payoutInstructions.trim();
  const label = input.label?.trim() || "Primary";

  const { data: existing } = await supabase
    .from("payout_recipients")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("recipient_type", "creator")
    .eq("creator_id", input.creatorId)
    .maybeSingle();

  const payload = {
    organization_id: organizationId,
    recipient_type: "creator" as const,
    creator_id: input.creatorId,
    label,
    payout_instructions: instructions || null,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase
      .from("payout_recipients")
      .update(payload)
      .eq("id", existing.id)
      .eq("organization_id", organizationId);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("payout_recipients").insert({
      ...payload,
      created_by: user.id,
    });

    if (error) return { error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath(`/creators/${input.creatorId}`);
  revalidatePath("/portal/account");
  return { success: true };
}

export async function ensureContractPaymentOnComplete(contractId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { data: existing } = await supabase
    .from("contract_payments")
    .select("id")
    .eq("contract_id", contractId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (existing) return { success: true, id: existing.id };

  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select("id, creator_id, contract_value")
    .eq("id", contractId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (contractError || !contract) {
    return { error: "Contract not found." };
  }

  const payee = derivePayeeFromContract({ creatorId: contract.creator_id });
  const amountCents = parseContractValueToCents(
    Number(contract.contract_value) || 0
  );

  const { data: recipient } = await supabase
    .from("payout_recipients")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("recipient_type", "creator")
    .eq("creator_id", contract.creator_id)
    .maybeSingle();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("contract_payments")
    .insert({
      organization_id: organizationId,
      contract_id: contractId,
      payee_type: payee.payeeType,
      payee_creator_id: payee.payeeCreatorId,
      payee_recipient_id: recipient?.id ?? null,
      amount_cents: amountCents,
      currency: "usd",
      status: deriveInitialPaymentStatus(amountCents),
      recorded_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/contracts/${contractId}`);
  return { success: true, id: data.id };
}

export async function recordExternalPayment(input: {
  contractId: string;
  externalReference?: string;
  notes?: string;
}) {
  const membership = await getCurrentUserMembership();
  if (!membership) {
    return { error: "You do not have permission to record payments." };
  }

  const canPayAsStaff = hasFullAccess(membership.role, "contracts");
  const canPayAsSponsor = isSponsorPortalRole(membership.role);

  if (!canPayAsStaff && !canPayAsSponsor) {
    return { error: "You do not have permission to record payments." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { data: contract } = await supabase
    .from("contracts")
    .select("id, sponsor_id")
    .eq("id", input.contractId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!contract) return { error: "Contract not found." };

  if (
    canPayAsSponsor &&
    !canPayAsStaff &&
    membership.linkedSponsorId !== contract.sponsor_id
  ) {
    return { error: "You can only record payments for your sponsor deals." };
  }

  const { data: payment, error: fetchError } = await supabase
    .from("contract_payments")
    .select("id, status")
    .eq("contract_id", input.contractId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (fetchError || !payment) {
    return { error: "No payment record found for this contract." };
  }

  if (!canRecordExternalPayment(payment.status)) {
    return { error: "This payment cannot be recorded in its current status." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error: updateError } = await supabase
    .from("contract_payments")
    .update({
      status: "paid_external",
      payment_method: "external",
      paid_at: new Date().toISOString(),
      recorded_by: user.id,
      external_reference: input.externalReference?.trim() || null,
      notes: input.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.id)
    .eq("organization_id", organizationId);

  if (updateError) return { error: updateError.message };

  revalidatePath(`/contracts/${input.contractId}`);
  revalidatePath("/contracts");
  return { success: true };
}
