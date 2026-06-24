"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import {
  requireApplicationAccess,
  requireFeatureAccess,
  requireOpportunityManageAccess,
  getCurrentUserMembership,
} from "@/lib/permissions";
import {
  type OpportunityInput,
  type ApplicationInput,
  opportunityStatuses,
  opportunityCategories,
  opportunityPlatforms,
  applicationStatuses,
  type OpportunityStatus,
  type ApplicationStatus,
  opportunityStatusLabels,
  applicationStatusLabels,
} from "@/lib/opportunities";
import type { ActivityAction } from "@/lib/activity/queries";
import { createDraftContractFromApplication } from "@/lib/opportunities/contract-from-application";
import {
  getOrCreateRelatedConversation,
  notifyDealRoom,
} from "@/app/messages/actions";
import {
  applicationStatusChangedMessage,
  applicationSubmittedMessage,
} from "@/lib/messages/system-events";
import { dispatchOrganizationWebhook } from "@/lib/api/webhooks";

async function logOpportunityActivity(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  organizationId: string,
  params: {
    entityId: string | null;
    action: ActivityAction;
    summary: string;
    detail?: string;
  }
) {
  await supabase.from("activity_log").insert({
    organization_id: organizationId,
    entity_type: "opportunity",
    entity_id: params.entityId,
    action: params.action,
    summary: params.summary,
    detail: params.detail ?? null,
  });
}

async function validateSponsorId(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  organizationId: string,
  sponsorId: string
): Promise<string | null> {
  const { data: sponsor } = await supabase
    .from("sponsors")
    .select("id")
    .eq("id", sponsorId)
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .maybeSingle();

  if (!sponsor) return "Sponsor not found in your organization.";
  return null;
}

function validateOpportunityInput(input: OpportunityInput) {
  if (!input.title.trim()) return "Title is required.";
  if (!input.sponsorId) return "Sponsor is required.";
  if (!opportunityCategories.includes(input.category)) return "Invalid category.";
  if (!opportunityPlatforms.includes(input.platform)) return "Invalid platform.";
  if (!opportunityStatuses.includes(input.status)) return "Invalid status.";
  return null;
}

async function requireOpportunityManageFeature() {
  return requireFeatureAccess(
    ["create_opportunities", "opportunity_management"],
    "Opportunity management"
  );
}

async function requireOpportunityApplyFeature() {
  return requireFeatureAccess(
    ["apply_opportunities", "opportunity_management"],
    "Apply to opportunities"
  );
}

function toOpportunityPayload(input: OpportunityInput) {
  return {
    title: input.title.trim(),
    description: input.description.trim() || null,
    sponsor_id: input.sponsorId,
    budget: input.budget,
    category: input.category,
    platform: input.platform,
    deliverables: input.deliverables.trim() || null,
    application_deadline: input.applicationDeadline || null,
    status: input.status,
  };
}

export async function createOpportunity(input: OpportunityInput) {
  const permError = await requireOpportunityManageAccess();
  if (permError) return permError;

  const featureError = await requireOpportunityManageFeature();
  if (featureError) return featureError;

  const error = validateOpportunityInput(input);
  if (error) return { error };

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const sponsorError = await validateSponsorId(
    supabase,
    organizationId,
    input.sponsorId
  );
  if (sponsorError) return { error: sponsorError };

  const { data, error: insertError } = await supabase
    .from("opportunities")
    .insert({
      organization_id: organizationId,
      ...toOpportunityPayload(input),
    })
    .select("id")
    .single();

  if (insertError) return { error: insertError.message };

  await logOpportunityActivity(supabase, organizationId, {
    entityId: data.id,
    action: "created",
    summary: "Opportunity created",
    detail: input.title.trim(),
  });

  revalidatePath("/opportunities");
  revalidatePath("/");
  return { id: data.id };
}

export async function updateOpportunity(id: string, input: OpportunityInput) {
  const permError = await requireOpportunityManageAccess();
  if (permError) return permError;

  const featureError = await requireOpportunityManageFeature();
  if (featureError) return featureError;

  const error = validateOpportunityInput(input);
  if (error) return { error };

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { data: existing } = await supabase
    .from("opportunities")
    .select("title, status")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!existing) return { error: "Opportunity not found." };

  const sponsorError = await validateSponsorId(
    supabase,
    organizationId,
    input.sponsorId
  );
  if (sponsorError) return { error: sponsorError };

  const { error: updateError } = await supabase
    .from("opportunities")
    .update({
      ...toOpportunityPayload(input),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (updateError) return { error: updateError.message };

  const statusChanged = existing.status !== input.status;

  await logOpportunityActivity(supabase, organizationId, {
    entityId: id,
    action: statusChanged ? "status_changed" : "updated",
    summary: statusChanged ? "Opportunity status changed" : "Opportunity updated",
    detail: statusChanged
      ? `${existing.title}: ${opportunityStatusLabels[existing.status as OpportunityStatus]} → ${opportunityStatusLabels[input.status]}`
      : input.title.trim(),
  });

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${id}`);
  revalidatePath("/");
  return { success: true };
}

export async function closeOpportunity(id: string) {
  const permError = await requireOpportunityManageAccess();
  if (permError) return permError;

  const featureError = await requireOpportunityManageFeature();
  if (featureError) return featureError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { data: existing } = await supabase
    .from("opportunities")
    .select("title")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!existing) return { error: "Opportunity not found." };

  const { error: updateError } = await supabase
    .from("opportunities")
    .update({ status: "closed", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (updateError) return { error: updateError.message };

  await logOpportunityActivity(supabase, organizationId, {
    entityId: id,
    action: "status_changed",
    summary: "Opportunity closed",
    detail: existing.title,
  });

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${id}`);
  revalidatePath("/");
  return { success: true };
}

export async function deleteOpportunity(id: string) {
  const permError = await requireOpportunityManageAccess();
  if (permError) return permError;

  const featureError = await requireOpportunityManageFeature();
  if (featureError) return featureError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { data: existing } = await supabase
    .from("opportunities")
    .select("title")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!existing) return { error: "Opportunity not found." };

  await logOpportunityActivity(supabase, organizationId, {
    entityId: id,
    action: "deleted",
    summary: "Opportunity deleted",
    detail: existing.title,
  });

  const { error: deleteError } = await supabase
    .from("opportunities")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (deleteError) return { error: deleteError.message };

  revalidatePath("/opportunities");
  revalidatePath("/");
  return { success: true };
}

export async function applyToOpportunity(input: ApplicationInput) {
  const permError = await requireApplicationAccess();
  if (permError) return permError;

  const membership = await getCurrentUserMembership();
  const isPortalCreator = membership?.role === "content_creator";

  let creatorId = input.creatorId;
  if (isPortalCreator) {
    if (!membership?.linkedCreatorId) {
      return { error: "Your portal account is not linked to a creator profile." };
    }
    if (creatorId && creatorId !== membership.linkedCreatorId) {
      return {
        error: "You can only apply as your linked creator profile.",
      };
    }
    creatorId = membership.linkedCreatorId;
  } else if (!creatorId) {
    return { error: "Creator is required." };
  }

  const featureError = await requireOpportunityApplyFeature();
  if (featureError) return featureError;

  if (!input.coverMessage.trim()) return { error: "Cover message is required." };

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id, title, status")
    .eq("id", input.opportunityId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!opportunity) return { error: "Opportunity not found." };
  if (opportunity.status !== "open") {
    return { error: "This opportunity is not accepting applications." };
  }

  const { data: creator } = await supabase
    .from("creators")
    .select("id, name")
    .eq("id", creatorId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!creator) return { error: "Creator not found." };

  const { data: existing } = await supabase
    .from("opportunity_applications")
    .select("id")
    .eq("opportunity_id", input.opportunityId)
    .eq("creator_id", creatorId)
    .maybeSingle();

  if (existing) return { error: "This creator has already applied." };

  const { data: application, error: insertError } = await supabase
    .from("opportunity_applications")
    .insert({
      opportunity_id: input.opportunityId,
      creator_id: creatorId,
      cover_message: input.coverMessage.trim(),
      proposed_rate: input.proposedRate,
      status: "applied",
    })
    .select("id")
    .single();

  if (insertError) return { error: insertError.message };

  dispatchOrganizationWebhook(organizationId, "application.created", {
    application_id: application.id,
    opportunity_id: input.opportunityId,
    opportunity_title: opportunity.title,
    creator_id: creatorId,
    creator_name: creator.name,
    status: "applied",
    proposed_rate: input.proposedRate,
  });

  await logOpportunityActivity(supabase, organizationId, {
    entityId: input.opportunityId,
    action: "created",
    summary: "New application received",
    detail: `${creator.name} applied to ${opportunity.title}`,
  });

  const room = await getOrCreateRelatedConversation(
    "opportunity",
    input.opportunityId
  );
  if (!("error" in room) && room.id) {
    await notifyDealRoom(
      room.id,
      applicationSubmittedMessage({
        creatorName: creator.name,
        opportunityTitle: opportunity.title,
        proposedRate: input.proposedRate,
      })
    );
  }

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${input.opportunityId}`);
  revalidatePath("/opportunities/applications");
  revalidatePath("/messages");
  revalidatePath("/");
  return { success: true };
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus
) {
  const permError = await requireOpportunityManageAccess();
  if (permError) return permError;

  const featureError = await requireOpportunityManageFeature();
  if (featureError) return featureError;

  if (!applicationStatuses.includes(status)) {
    return { error: "Invalid application status." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { data: application } = await supabase
    .from("opportunity_applications")
    .select(
      `id, status, opportunity_id, creators ( name ), opportunities ( title, organization_id )`
    )
    .eq("id", applicationId)
    .maybeSingle();

  if (!application) return { error: "Application not found." };

  const opportunity = Array.isArray(application.opportunities)
    ? application.opportunities[0]
    : application.opportunities;

  if (!opportunity || opportunity.organization_id !== organizationId) {
    return { error: "Application not found." };
  }

  const creator = Array.isArray(application.creators)
    ? application.creators[0]
    : application.creators;

  const { error: updateError } = await supabase
    .from("opportunity_applications")
    .update({ status })
    .eq("id", applicationId);

  if (updateError) return { error: updateError.message };

  let contractId: string | undefined;
  let contractName: string | undefined;

  if (status === "accepted") {
    await supabase
      .from("opportunities")
      .update({ status: "filled", updated_at: new Date().toISOString() })
      .eq("id", application.opportunity_id);

    await supabase
      .from("opportunity_applications")
      .update({ status: "rejected" })
      .eq("opportunity_id", application.opportunity_id)
      .neq("id", applicationId)
      .in("status", ["applied", "under_review"]);

    const contractResult = await createDraftContractFromApplication(
      supabase,
      organizationId,
      applicationId
    );

    if ("error" in contractResult) {
      return { error: contractResult.error };
    }

    contractId = contractResult.contractId;

    const { data: contractRow } = await supabase
      .from("contracts")
      .select("contract_name")
      .eq("id", contractId)
      .maybeSingle();
    contractName = contractRow?.contract_name;
  }

  const room = await getOrCreateRelatedConversation(
    "opportunity",
    application.opportunity_id
  );
  if (!("error" in room) && room.id) {
    await notifyDealRoom(
      room.id,
      applicationStatusChangedMessage({
        creatorName: creator?.name ?? "Creator",
        opportunityTitle: opportunity.title,
        status,
        contractName,
      })
    );
  }

  await logOpportunityActivity(supabase, organizationId, {
    entityId: application.opportunity_id,
    action: "status_changed",
    summary: `Application ${applicationStatusLabels[status].toLowerCase()}`,
    detail: `${creator?.name ?? "Creator"} — ${opportunity.title}`,
  });

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${application.opportunity_id}`);
  revalidatePath("/opportunities/applications");
  revalidatePath("/contracts");
  revalidatePath("/messages");
  if (contractId) revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/");
  return { success: true, contractId };
}

export async function acceptApplication(applicationId: string) {
  return updateApplicationStatus(applicationId, "accepted");
}

export async function rejectApplication(applicationId: string) {
  return updateApplicationStatus(applicationId, "rejected");
}

export async function markApplicationUnderReview(applicationId: string) {
  return updateApplicationStatus(applicationId, "under_review");
}
