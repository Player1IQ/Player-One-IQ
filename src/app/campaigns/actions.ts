"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import {
  requireFeatureAccess,
  requireUsageWithinLimit,
  requireWriteAccess,
} from "@/lib/permissions";
import {
  type CampaignInput,
  campaignStatuses,
} from "@/lib/campaigns";
import { getUsageMetricCount, incrementUsageMetric } from "@/lib/subscription/usage";

function validateInput(input: CampaignInput) {
  if (!input.name.trim()) return "Campaign name is required.";
  if (!input.sponsorId) return "Sponsor is required.";
  if (!campaignStatuses.includes(input.status)) return "Invalid campaign status.";
  if (input.budget !== null && input.budget < 0) {
    return "Budget cannot be negative.";
  }
  if (input.startDate && input.endDate && input.endDate < input.startDate) {
    return "End date must be on or after start date.";
  }
  return null;
}

function toDbPayload(input: CampaignInput) {
  return {
    name: input.name.trim(),
    sponsor_id: input.sponsorId,
    status: input.status,
    budget: input.budget,
    start_date: input.startDate || null,
    end_date: input.endDate || null,
    notes: input.notes.trim() || null,
    related_opportunity_id: input.relatedOpportunityId || null,
  };
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
    .maybeSingle();

  if (!sponsor) return "Sponsor not found in your organization.";
  return null;
}

async function validateOpportunityId(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  organizationId: string,
  opportunityId: string | null
): Promise<string | null> {
  if (!opportunityId) return null;

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id")
    .eq("id", opportunityId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!opportunity) return "Opportunity not found in your organization.";
  return null;
}

export async function createCampaign(input: CampaignInput) {
  const permError = await requireWriteAccess();
  if (permError) return permError;

  const featureError = await requireFeatureAccess(
    "campaign_tracking",
    "Campaign tracking"
  );
  if (featureError) return featureError;

  const error = validateInput(input);
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

  const opportunityError = await validateOpportunityId(
    supabase,
    organizationId,
    input.relatedOpportunityId
  );
  if (opportunityError) return { error: opportunityError };

  const campaignCount = await getUsageMetricCount("campaigns");
  const limitError = await requireUsageWithinLimit(
    "campaigns",
    campaignCount,
    "campaigns"
  );
  if (limitError) return limitError;

  const { data, error: insertError } = await supabase
    .from("sponsor_campaigns")
    .insert({
      organization_id: organizationId,
      ...toDbPayload(input),
    })
    .select("id")
    .single();

  if (insertError) return { error: insertError.message };

  await incrementUsageMetric("campaigns");

  revalidatePath("/campaigns");
  revalidatePath("/sponsors");
  revalidatePath(`/sponsors/${input.sponsorId}`);
  revalidatePath("/");
  return { id: data.id };
}

export async function updateCampaign(id: string, input: CampaignInput) {
  const permError = await requireWriteAccess();
  if (permError) return permError;

  const featureError = await requireFeatureAccess(
    "campaign_tracking",
    "Campaign tracking"
  );
  if (featureError) return featureError;

  const error = validateInput(input);
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

  const opportunityError = await validateOpportunityId(
    supabase,
    organizationId,
    input.relatedOpportunityId
  );
  if (opportunityError) return { error: opportunityError };

  const { error: updateError } = await supabase
    .from("sponsor_campaigns")
    .update({
      ...toDbPayload(input),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/campaigns");
  revalidatePath("/sponsors");
  revalidatePath(`/sponsors/${input.sponsorId}`);
  return { success: true };
}

export async function deleteCampaign(id: string) {
  const permError = await requireWriteAccess();
  if (permError) return permError;

  const featureError = await requireFeatureAccess(
    "campaign_tracking",
    "Campaign tracking"
  );
  if (featureError) return featureError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { data: existing } = await supabase
    .from("sponsor_campaigns")
    .select("sponsor_id")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  const { error: deleteError } = await supabase
    .from("sponsor_campaigns")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (deleteError) return { error: deleteError.message };

  revalidatePath("/campaigns");
  revalidatePath("/sponsors");
  if (existing?.sponsor_id) {
    revalidatePath(`/sponsors/${existing.sponsor_id}`);
  }
  return { success: true };
}
