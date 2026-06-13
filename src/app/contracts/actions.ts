"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import { requireWriteAccess } from "@/lib/permissions";
import {
  type ContractInput,
  contractStatuses,
  type ContractStatus,
  contractStatusLabels,
  canTransitionContractStatus,
  formatCurrency,
} from "@/lib/contracts";
import {
  getOrCreateRelatedConversation,
  sendMessage,
} from "@/app/messages/actions";
import { buildContractNegotiationMessage } from "@/lib/contracts/negotiation-message";
import type { ActivityAction } from "@/lib/activity/queries";

async function logActivity(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  organizationId: string,
  params: {
    entityType: string;
    entityId: string | null;
    action: ActivityAction;
    summary: string;
    detail?: string;
    metadata?: Record<string, unknown>;
  }
) {
  await supabase.from("activity_log").insert({
    organization_id: organizationId,
    entity_type: params.entityType,
    entity_id: params.entityId,
    action: params.action,
    summary: params.summary,
    detail: params.detail ?? null,
    metadata: params.metadata ?? {},
  });
}

async function validateRelations(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  organizationId: string,
  creatorId: string,
  sponsorId: string
) {
  const [{ data: creator }, { data: sponsor }] = await Promise.all([
    supabase
      .from("creators")
      .select("id")
      .eq("id", creatorId)
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase
      .from("sponsors")
      .select("id")
      .eq("id", sponsorId)
      .eq("organization_id", organizationId)
      .maybeSingle(),
  ]);

  if (!creator) return "Creator not found in your organization.";
  if (!sponsor) return "Sponsor not found in your organization.";
  return null;
}

function validateInput(input: ContractInput) {
  if (!input.contractName.trim()) {
    return "Contract name is required.";
  }
  if (!input.creatorId) return "Creator is required.";
  if (!input.sponsorId) return "Sponsor is required.";
  if (!contractStatuses.includes(input.status)) {
    return "Invalid contract status.";
  }
  if (input.contractValue < 0) {
    return "Contract value cannot be negative.";
  }
  if (input.startDate && input.endDate && input.endDate < input.startDate) {
    return "End date must be on or after start date.";
  }
  return null;
}

function toDbPayload(input: ContractInput) {
  return {
    creator_id: input.creatorId,
    sponsor_id: input.sponsorId,
    contract_name: input.contractName.trim(),
    contract_value: input.contractValue,
    contract_status: input.status,
    start_date: input.startDate || null,
    end_date: input.endDate || null,
    deliverables: input.deliverables.trim() || null,
    notes: input.notes.trim() || null,
  };
}

export async function createContract(input: ContractInput) {
  const permError = await requireWriteAccess();
  if (permError) return permError;

  const error = validateInput(input);
  if (error) return { error };

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const relationError = await validateRelations(
    supabase,
    organizationId,
    input.creatorId,
    input.sponsorId
  );
  if (relationError) return { error: relationError };

  const { data, error: insertError } = await supabase
    .from("contracts")
    .insert({
      organization_id: organizationId,
      ...toDbPayload(input),
    })
    .select("id")
    .single();

  if (insertError) return { error: insertError.message };

  await logActivity(supabase, organizationId, {
    entityType: "contract",
    entityId: data.id,
    action: "created",
    summary: "Contract created",
    detail: input.contractName.trim(),
    metadata: { status: input.status },
  });

  revalidatePath("/contracts");
  revalidatePath("/");
  return { id: data.id };
}

export async function updateContract(id: string, input: ContractInput) {
  const permError = await requireWriteAccess();
  if (permError) return permError;

  const error = validateInput(input);
  if (error) return { error };

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const relationError = await validateRelations(
    supabase,
    organizationId,
    input.creatorId,
    input.sponsorId
  );
  if (relationError) return { error: relationError };

  const { data: existing, error: fetchError } = await supabase
    .from("contracts")
    .select("contract_name, contract_status")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { error: "Contract not found." };
  }

  const previousStatus = existing.contract_status as ContractStatus;
  if (
    previousStatus !== input.status &&
    !canTransitionContractStatus(previousStatus, input.status)
  ) {
    return {
      error: `Cannot change status from ${contractStatusLabels[previousStatus]} to ${contractStatusLabels[input.status]}.`,
    };
  }

  const { error: updateError } = await supabase
    .from("contracts")
    .update({
      ...toDbPayload(input),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (updateError) return { error: updateError.message };

  const statusChanged = previousStatus !== input.status;

  await logActivity(supabase, organizationId, {
    entityType: "contract",
    entityId: id,
    action: statusChanged ? "status_changed" : "updated",
    summary: statusChanged
      ? "Contract status changed"
      : "Contract updated",
    detail: statusChanged
      ? `${existing.contract_name}: ${contractStatusLabels[previousStatus]} → ${contractStatusLabels[input.status]}`
      : input.contractName.trim(),
    metadata: {
      previousStatus: existing.contract_status,
      newStatus: input.status,
    },
  });

  revalidatePath("/contracts");
  revalidatePath(`/contracts/${id}`);
  revalidatePath("/");
  return { success: true };
}

export async function updateContractStatus(
  id: string,
  newStatus: ContractStatus
) {
  const permError = await requireWriteAccess();
  if (permError) return permError;

  if (!contractStatuses.includes(newStatus)) {
    return { error: "Invalid contract status." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { data: existing, error: fetchError } = await supabase
    .from("contracts")
    .select("contract_name, contract_status")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { error: "Contract not found." };
  }

  const previousStatus = existing.contract_status as ContractStatus;
  if (previousStatus === newStatus) {
    return { success: true };
  }

  if (!canTransitionContractStatus(previousStatus, newStatus)) {
    return {
      error: `Cannot change status from ${contractStatusLabels[previousStatus]} to ${contractStatusLabels[newStatus]}.`,
    };
  }

  const { error: updateError } = await supabase
    .from("contracts")
    .update({
      contract_status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (updateError) return { error: updateError.message };

  await logActivity(supabase, organizationId, {
    entityType: "contract",
    entityId: id,
    action: "status_changed",
    summary: "Contract status changed",
    detail: `${existing.contract_name}: ${contractStatusLabels[previousStatus]} → ${contractStatusLabels[newStatus]}`,
    metadata: {
      previousStatus,
      newStatus,
    },
  });

  revalidatePath("/contracts");
  revalidatePath(`/contracts/${id}`);
  revalidatePath("/");
  revalidatePath(`/creators`);
  revalidatePath(`/sponsors`);
  return { success: true };
}

export async function updateContractDealTerms(
  id: string,
  contractValue: number,
  negotiationNote?: string
) {
  const permError = await requireWriteAccess();
  if (permError) return permError;

  if (!Number.isFinite(contractValue) || contractValue < 0) {
    return { error: "Contract value must be zero or greater." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { data: existing, error: fetchError } = await supabase
    .from("contracts")
    .select(
      `contract_name, contract_status, contract_value, notes,
      creators ( name ),
      sponsors ( company_name )`
    )
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { error: "Contract not found." };
  }

  const status = existing.contract_status as ContractStatus;
  if (status !== "draft" && status !== "negotiating") {
    return {
      error: "Deal terms can only be updated while the contract is draft or negotiating.",
    };
  }

  const previousValue = Number(existing.contract_value) || 0;
  const trimmedNote = negotiationNote?.trim() ?? "";
  let notes = existing.notes ?? "";

  if (trimmedNote) {
    const stamp = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    const valueLine =
      previousValue !== contractValue
        ? `Value: ${formatCurrency(previousValue)} → ${formatCurrency(contractValue)}`
        : `Value: ${formatCurrency(contractValue)}`;
    notes = [notes, `[${stamp}] Negotiation\n${valueLine}\n${trimmedNote}`]
      .filter(Boolean)
      .join("\n\n");
  }

  const { error: updateError } = await supabase
    .from("contracts")
    .update({
      contract_value: contractValue,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (updateError) return { error: updateError.message };

  await logActivity(supabase, organizationId, {
    entityType: "contract",
    entityId: id,
    action: "updated",
    summary: "Contract deal terms updated",
    detail: `${existing.contract_name}: ${formatCurrency(previousValue)} → ${formatCurrency(contractValue)}`,
    metadata: { previousValue, contractValue },
  });

  let dealRoomId: string | undefined;
  const creator = Array.isArray(existing.creators)
    ? existing.creators[0]
    : existing.creators;
  const sponsor = Array.isArray(existing.sponsors)
    ? existing.sponsors[0]
    : existing.sponsors;

  const room = await getOrCreateRelatedConversation("contract", id);
  if (!("error" in room) && room.id) {
    const message = buildContractNegotiationMessage({
      contractName: existing.contract_name,
      sponsorName: sponsor?.company_name ?? "Sponsor",
      creatorName: creator?.name ?? "Creator",
      previousValue,
      contractValue,
      status,
      negotiationNote: trimmedNote || undefined,
    });
    const sent = await sendMessage(room.id, message);
    if (!("error" in sent)) {
      dealRoomId = room.id;
    }
  }

  revalidatePath("/contracts");
  revalidatePath(`/contracts/${id}`);
  revalidatePath("/messages");
  revalidatePath("/");
  return { success: true, dealRoomId };
}

export async function deleteContract(id: string) {
  const permError = await requireWriteAccess();
  if (permError) return permError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { data: existing, error: fetchError } = await supabase
    .from("contracts")
    .select("contract_name")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { error: "Contract not found." };
  }

  await logActivity(supabase, organizationId, {
    entityType: "contract",
    entityId: id,
    action: "deleted",
    summary: "Contract deleted",
    detail: existing.contract_name,
  });

  const { error: deleteError } = await supabase
    .from("contracts")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (deleteError) return { error: deleteError.message };

  revalidatePath("/contracts");
  revalidatePath("/");
  return { success: true };
}
