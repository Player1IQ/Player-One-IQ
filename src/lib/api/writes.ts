import {
  canTransitionContractStatus,
  contractStatuses,
  contractStatusLabels,
  type Contract,
  type ContractStatus,
} from "@/lib/contracts";
import {
  deliverableStatuses,
  type ContractDeliverable,
  type DeliverableStatus,
} from "@/lib/contract-deliverables";
import {
  mapApplicationRow,
  type ApplicationRow,
  type OpportunityApplication,
} from "@/lib/opportunities";
import { createServiceClient } from "@/lib/supabase/admin";
import { dispatchOrganizationWebhook } from "./webhooks";
import type { ApiMutationResult } from "./route-handler";
import {
  getContractForOrganization,
  getDeliverableForOrganization,
} from "./data";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickString(
  body: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = body[key];
    if (typeof value === "string") return value;
  }
  return undefined;
}

function pickNumber(
  body: Record<string, unknown>,
  ...keys: string[]
): number | undefined {
  for (const key of keys) {
    const value = body[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return undefined;
}

function pickNullableNumber(
  body: Record<string, unknown>,
  ...keys: string[]
): number | null | undefined {
  for (const key of keys) {
    if (!(key in body)) continue;
    const value = body[key];
    if (value === null) return null;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    return undefined;
  }
  return undefined;
}

function invalidBody(message: string): ApiMutationResult<never> {
  return { kind: "error", status: 400, code: "invalid_input", error: message };
}

function serviceUnavailable(): ApiMutationResult<never> {
  return {
    kind: "error",
    status: 503,
    code: "service_unavailable",
    error: "API is not configured.",
  };
}

export async function patchContractForOrganization(
  organizationId: string,
  contractId: string,
  body: unknown
): Promise<ApiMutationResult<Contract>> {
  if (!isRecord(body)) {
    return invalidBody("Request body must be a JSON object.");
  }

  const statusRaw = pickString(body, "status");
  const contractValue = pickNumber(body, "contractValue", "contract_value");

  if (statusRaw === undefined && contractValue === undefined) {
    return invalidBody("Provide at least one of status or contractValue.");
  }

  const supabase = createServiceClient();
  if (!supabase) return serviceUnavailable();

  const { data: existing, error: fetchError } = await supabase
    .from("contracts")
    .select(
      "id, contract_name, contract_status, contract_value, creator_id, sponsor_id"
    )
    .eq("id", contractId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { kind: "not_found" };
  }

  const previousStatus = existing.contract_status as ContractStatus;
  const previousValue = Number(existing.contract_value) || 0;
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  let nextStatus = previousStatus;
  let statusChanged = false;

  if (statusRaw !== undefined) {
    if (!contractStatuses.includes(statusRaw as ContractStatus)) {
      return invalidBody("Invalid contract status.");
    }
    const newStatus = statusRaw as ContractStatus;
    if (
      newStatus !== previousStatus &&
      !canTransitionContractStatus(previousStatus, newStatus)
    ) {
      return {
        kind: "error",
        status: 400,
        code: "invalid_transition",
        error: `Cannot change status from ${contractStatusLabels[previousStatus]} to ${contractStatusLabels[newStatus]}.`,
      };
    }
    nextStatus = newStatus;
    statusChanged = newStatus !== previousStatus;
    updates.contract_status = newStatus;
  }

  let valueChanged = false;
  if (contractValue !== undefined) {
    if (contractValue < 0) {
      return invalidBody("Contract value cannot be negative.");
    }
    valueChanged = contractValue !== previousValue;
    updates.contract_value = contractValue;
  }

  if (!statusChanged && !valueChanged) {
    const current = await getContractForOrganization(organizationId, contractId);
    if (!current) return { kind: "not_found" };
    return { kind: "success", data: current };
  }

  const { error: updateError } = await supabase
    .from("contracts")
    .update(updates)
    .eq("id", contractId)
    .eq("organization_id", organizationId);

  if (updateError) {
    return {
      kind: "error",
      status: 400,
      code: "update_failed",
      error: updateError.message,
    };
  }

  dispatchOrganizationWebhook(organizationId, "contract.updated", {
    contract_id: contractId,
    contract_name: existing.contract_name,
    status: nextStatus,
    previous_status: previousStatus,
    creator_id: existing.creator_id,
    sponsor_id: existing.sponsor_id,
    ...(contractValue !== undefined
      ? { contract_value: contractValue }
      : { contract_value: previousValue }),
    ...(valueChanged ? { previous_contract_value: previousValue } : {}),
  });

  const updated = await getContractForOrganization(organizationId, contractId);
  if (!updated) return { kind: "not_found" };
  return { kind: "success", data: updated };
}

export async function patchDeliverableForOrganization(
  organizationId: string,
  deliverableId: string,
  body: unknown
): Promise<ApiMutationResult<ContractDeliverable>> {
  if (!isRecord(body)) {
    return invalidBody("Request body must be a JSON object.");
  }

  const statusRaw = pickString(body, "status");
  if (statusRaw === undefined) {
    return invalidBody("status is required.");
  }
  if (!deliverableStatuses.includes(statusRaw as DeliverableStatus)) {
    return invalidBody(
      "Invalid deliverable status. Use pending, in_progress, or completed."
    );
  }
  const newStatus = statusRaw as DeliverableStatus;

  const supabase = createServiceClient();
  if (!supabase) return serviceUnavailable();

  const { data: existing, error: fetchError } = await supabase
    .from("contract_deliverables")
    .select("id, contract_id, title, status")
    .eq("id", deliverableId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { kind: "not_found" };
  }

  const previousStatus = existing.status as DeliverableStatus;
  const completedNow =
    newStatus === "completed" && previousStatus !== "completed";
  const completedAt =
    newStatus === "completed" ? new Date().toISOString() : null;

  if (newStatus === previousStatus) {
    const current = await getDeliverableForOrganization(
      organizationId,
      deliverableId
    );
    if (!current) return { kind: "not_found" };
    return { kind: "success", data: current };
  }

  const { error: updateError } = await supabase
    .from("contract_deliverables")
    .update({
      status: newStatus,
      completed_at: completedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", deliverableId)
    .eq("organization_id", organizationId);

  if (updateError) {
    return {
      kind: "error",
      status: 400,
      code: "update_failed",
      error: updateError.message,
    };
  }

  if (completedNow && completedAt) {
    dispatchOrganizationWebhook(organizationId, "deliverable.completed", {
      deliverable_id: deliverableId,
      contract_id: existing.contract_id,
      title: existing.title,
      completed_at: completedAt,
    });
  }

  const updated = await getDeliverableForOrganization(
    organizationId,
    deliverableId
  );
  if (!updated) return { kind: "not_found" };
  return { kind: "success", data: updated };
}

export async function createOpportunityApplicationForOrganization(
  organizationId: string,
  opportunityId: string,
  body: unknown
): Promise<ApiMutationResult<OpportunityApplication>> {
  if (!isRecord(body)) {
    return invalidBody("Request body must be a JSON object.");
  }

  const creatorId = pickString(body, "creatorId", "creator_id");
  const coverMessage = pickString(body, "coverMessage", "cover_message");
  const proposedRateRaw = pickNullableNumber(
    body,
    "proposedRate",
    "proposed_rate"
  );
  const proposedRate = proposedRateRaw === undefined ? null : proposedRateRaw;

  if (!creatorId) {
    return invalidBody("creatorId is required.");
  }
  if (!coverMessage?.trim()) {
    return invalidBody("coverMessage is required.");
  }
  if (
    proposedRateRaw !== undefined &&
    proposedRateRaw !== null &&
    proposedRateRaw < 0
  ) {
    return invalidBody("proposedRate cannot be negative.");
  }

  const supabase = createServiceClient();
  if (!supabase) return serviceUnavailable();

  const { data: opportunity, error: opportunityError } = await supabase
    .from("opportunities")
    .select("id, title, status")
    .eq("id", opportunityId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (opportunityError || !opportunity) {
    return { kind: "not_found" };
  }
  if (opportunity.status !== "open") {
    return {
      kind: "error",
      status: 400,
      code: "opportunity_closed",
      error: "This opportunity is not accepting applications.",
    };
  }

  const { data: creator, error: creatorError } = await supabase
    .from("creators")
    .select("id, name")
    .eq("id", creatorId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (creatorError || !creator) {
    return {
      kind: "error",
      status: 400,
      code: "invalid_creator",
      error: "Creator not found in your organization.",
    };
  }

  const { data: existing } = await supabase
    .from("opportunity_applications")
    .select("id")
    .eq("opportunity_id", opportunityId)
    .eq("creator_id", creatorId)
    .maybeSingle();

  if (existing) {
    return {
      kind: "error",
      status: 400,
      code: "duplicate_application",
      error: "This creator has already applied.",
    };
  }

  const { data: application, error: insertError } = await supabase
    .from("opportunity_applications")
    .insert({
      opportunity_id: opportunityId,
      creator_id: creatorId,
      cover_message: coverMessage.trim(),
      proposed_rate: proposedRate,
      status: "applied",
    })
    .select(
      `
      *,
      creators ( name ),
      opportunities ( title, status )
    `
    )
    .single();

  if (insertError || !application) {
    return {
      kind: "error",
      status: 400,
      code: "create_failed",
      error: insertError?.message ?? "Unable to create application.",
    };
  }

  dispatchOrganizationWebhook(organizationId, "application.created", {
    application_id: application.id,
    opportunity_id: opportunityId,
    opportunity_title: opportunity.title,
    creator_id: creatorId,
    creator_name: creator.name,
    status: "applied",
    proposed_rate: proposedRate,
  });

  return {
    kind: "success",
    data: mapApplicationRow(application as ApplicationRow, null),
  };
}
