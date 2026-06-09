"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import { requireWriteAccess } from "@/lib/permissions";
import {
  type SponsorInput,
  industries,
  sponsorStatuses,
  type ContactInfo,
} from "@/lib/sponsors";

function normalizeContact(contact: ContactInfo): ContactInfo {
  return {
    name: contact.name.trim(),
    title: contact.title.trim(),
    email: contact.email.trim(),
    phone: contact.phone.trim(),
  };
}

function hasContactInfo(contact: ContactInfo): boolean {
  return !!(
    contact.name ||
    contact.email ||
    contact.title ||
    contact.phone
  );
}

function validateInput(input: SponsorInput) {
  if (!input.companyName.trim()) {
    return "Company name is required.";
  }
  if (!industries.includes(input.industry)) {
    return "Invalid industry.";
  }
  if (!sponsorStatuses.includes(input.status)) {
    return "Invalid status.";
  }
  const primary = normalizeContact(input.primaryContact);
  if (!primary.name) {
    return "Primary contact name is required.";
  }
  if (!primary.email) {
    return "Primary contact email is required.";
  }
  return null;
}

function toDbPayload(input: SponsorInput) {
  const primaryContact = normalizeContact(input.primaryContact);
  const secondary = input.secondaryContact
    ? normalizeContact(input.secondaryContact)
    : null;

  return {
    company_name: input.companyName.trim(),
    industry: input.industry,
    status: input.status,
    website: input.website.trim() || null,
    headquarters: input.headquarters.trim() || null,
    founded: input.founded.trim() || null,
    description: input.description.trim() || null,
    primary_contact: primaryContact,
    secondary_contact:
      secondary && hasContactInfo(secondary) ? secondary : null,
    internal_notes: input.internalNotes.trim() || null,
  };
}

export async function createSponsor(input: SponsorInput) {
  const permError = await requireWriteAccess();
  if (permError) return permError;

  const error = validateInput(input);
  if (error) return { error };

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { data, error: insertError } = await supabase
    .from("sponsors")
    .insert({
      organization_id: organizationId,
      ...toDbPayload(input),
    })
    .select("id")
    .single();

  if (insertError) return { error: insertError.message };

  revalidatePath("/sponsors");
  revalidatePath("/");
  return { id: data.id };
}

export async function updateSponsor(id: string, input: SponsorInput) {
  const permError = await requireWriteAccess();
  if (permError) return permError;

  const error = validateInput(input);
  if (error) return { error };

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { error: updateError } = await supabase
    .from("sponsors")
    .update({
      ...toDbPayload(input),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/sponsors");
  revalidatePath(`/sponsors/${id}`);
  return { success: true };
}

export async function deleteSponsor(id: string) {
  const permError = await requireWriteAccess();
  if (permError) return permError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { error: deleteError } = await supabase
    .from("sponsors")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (deleteError) return { error: deleteError.message };

  revalidatePath("/sponsors");
  revalidatePath("/");
  return { success: true };
}
