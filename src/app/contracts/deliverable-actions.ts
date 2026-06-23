"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import {
  getCurrentUserMembership,
  isPortalRole,
  requireDeliverableUpdateAccess,
  requireFeatureAccess,
  requireResourceWriteAccess,
  hasFullAccess,
} from "@/lib/permissions";

async function requireContractsFeature() {
  return requireFeatureAccess("contracts", "Contracts");
}
import {
  deliverableStatuses,
  type DeliverableStatus,
} from "@/lib/contract-deliverables";
import type { ActivityAction } from "@/lib/activity/queries";

async function logActivity(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  organizationId: string,
  params: {
    entityId: string | null;
    action: ActivityAction;
    summary: string;
    detail?: string;
    metadata?: Record<string, unknown>;
  }
) {
  await supabase.from("activity_log").insert({
    organization_id: organizationId,
    entity_type: "contract_deliverable",
    entity_id: params.entityId,
    action: params.action,
    summary: params.summary,
    detail: params.detail ?? null,
    metadata: params.metadata ?? {},
  });
}

async function getContractForDeliverable(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  contractId: string,
  organizationId: string
) {
  const { data, error } = await supabase
    .from("contracts")
    .select("id, contract_name")
    .eq("id", contractId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

function revalidateContractPaths(contractId: string) {
  revalidatePath("/contracts");
  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/portal");
}

export async function createDeliverable(
  contractId: string,
  input: { title: string; dueDate?: string | null; status?: DeliverableStatus }
) {
  const featureError = await requireContractsFeature();
  if (featureError) return featureError;

  const permError = await requireResourceWriteAccess("contracts");
  if (permError) return permError;

  const title = input.title.trim();
  if (!title) return { error: "Deliverable title is required." };

  const status = input.status ?? "pending";
  if (!deliverableStatuses.includes(status)) {
    return { error: "Invalid deliverable status." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const contract = await getContractForDeliverable(
    supabase,
    contractId,
    organizationId
  );
  if (!contract) return { error: "Contract not found." };

  const { data: maxRow } = await supabase
    .from("contract_deliverables")
    .select("sort_order")
    .eq("contract_id", contractId)
    .eq("organization_id", organizationId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sortOrder = (maxRow?.sort_order ?? -1) + 1;
  const completedAt = status === "completed" ? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from("contract_deliverables")
    .insert({
      organization_id: organizationId,
      contract_id: contractId,
      title,
      status,
      due_date: input.dueDate || null,
      completed_at: completedAt,
      sort_order: sortOrder,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logActivity(supabase, organizationId, {
    entityId: data.id,
    action: "created",
    summary: "Deliverable added",
    detail: `${contract.contract_name}: ${title}`,
    metadata: { contractId },
  });

  revalidateContractPaths(contractId);
  return { id: data.id };
}

export async function updateDeliverable(
  id: string,
  input: {
    title?: string;
    dueDate?: string | null;
    status?: DeliverableStatus;
  }
) {
  const featureError = await requireContractsFeature();
  if (featureError) return featureError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { data: existing, error: fetchError } = await supabase
    .from("contract_deliverables")
    .select("id, contract_id, title, status")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { error: "Deliverable not found." };
  }

  const permError = await requireDeliverableUpdateAccess(existing.contract_id);
  if (permError) return permError;

  const membership = await getCurrentUserMembership();
  const portalStatusOnly =
    membership &&
    isPortalRole(membership.role) &&
    !hasFullAccess(membership.role, "contracts");

  if (portalStatusOnly) {
    if (input.title !== undefined || input.dueDate !== undefined) {
      return { error: "You can only update deliverable status." };
    }
    if (input.status === undefined) {
      return { error: "No changes specified." };
    }
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) {
    const title = input.title.trim();
    if (!title) return { error: "Deliverable title is required." };
    updates.title = title;
  }

  if (input.dueDate !== undefined) {
    updates.due_date = input.dueDate || null;
  }

  if (input.status !== undefined) {
    if (!deliverableStatuses.includes(input.status)) {
      return { error: "Invalid deliverable status." };
    }
    updates.status = input.status;
    updates.completed_at =
      input.status === "completed" ? new Date().toISOString() : null;
  }

  const { error: updateError } = await supabase
    .from("contract_deliverables")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (updateError) return { error: updateError.message };

  await logActivity(supabase, organizationId, {
    entityId: id,
    action: "updated",
    summary: "Deliverable updated",
    detail: input.title?.trim() ?? existing.title,
    metadata: { contractId: existing.contract_id },
  });

  revalidateContractPaths(existing.contract_id);
  return { success: true };
}

export async function toggleDeliverableComplete(id: string) {
  const featureError = await requireContractsFeature();
  if (featureError) return featureError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { data: existing, error: fetchError } = await supabase
    .from("contract_deliverables")
    .select("id, contract_id, title, status")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { error: "Deliverable not found." };
  }

  const permError = await requireDeliverableUpdateAccess(existing.contract_id);
  if (permError) return permError;

  const completing = existing.status !== "completed";
  const newStatus: DeliverableStatus = completing ? "completed" : "pending";

  const { error: updateError } = await supabase
    .from("contract_deliverables")
    .update({
      status: newStatus,
      completed_at: completing ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (updateError) return { error: updateError.message };

  await logActivity(supabase, organizationId, {
    entityId: id,
    action: completing ? "status_changed" : "updated",
    summary: completing ? "Deliverable completed" : "Deliverable reopened",
    detail: existing.title,
    metadata: { contractId: existing.contract_id, status: newStatus },
  });

  revalidateContractPaths(existing.contract_id);
  return { success: true, status: newStatus };
}

export async function deleteDeliverable(id: string) {
  const featureError = await requireContractsFeature();
  if (featureError) return featureError;

  const permError = await requireResourceWriteAccess("contracts");
  if (permError) return permError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { data: existing, error: fetchError } = await supabase
    .from("contract_deliverables")
    .select("id, contract_id, title")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { error: "Deliverable not found." };
  }

  await logActivity(supabase, organizationId, {
    entityId: id,
    action: "deleted",
    summary: "Deliverable removed",
    detail: existing.title,
    metadata: { contractId: existing.contract_id },
  });

  const { error: deleteError } = await supabase
    .from("contract_deliverables")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (deleteError) return { error: deleteError.message };

  revalidateContractPaths(existing.contract_id);
  return { success: true };
}

export async function reorderDeliverables(
  contractId: string,
  orderedIds: string[]
) {
  const featureError = await requireContractsFeature();
  if (featureError) return featureError;

  const permError = await requireResourceWriteAccess("contracts");
  if (permError) return permError;

  if (orderedIds.length === 0) return { success: true };

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const contract = await getContractForDeliverable(
    supabase,
    contractId,
    organizationId
  );
  if (!contract) return { error: "Contract not found." };

  const now = new Date().toISOString();
  const updates = orderedIds.map((id, index) =>
    supabase
      .from("contract_deliverables")
      .update({ sort_order: index, updated_at: now })
      .eq("id", id)
      .eq("contract_id", contractId)
      .eq("organization_id", organizationId)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  revalidateContractPaths(contractId);
  return { success: true };
}
