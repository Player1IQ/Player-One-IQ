"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import { requireWriteAccess } from "@/lib/permissions";
import { isSeedEnabled, SEED_MARKER } from "@/lib/seed/constants";
import {
  getSeedCreatorRows,
  getSeedOpportunityRow,
  getSeedSponsorRow,
  isSeedOpportunityTitle,
} from "@/lib/seed/test-data";

export interface SeedTestDataResult {
  created: {
    creators: number;
    sponsors: number;
    opportunities: number;
  };
  skipped: {
    creators: boolean;
    sponsors: boolean;
    opportunities: boolean;
  };
  message: string;
}

export async function seedTestData(): Promise<
  SeedTestDataResult | { error: string }
> {
  if (!isSeedEnabled()) {
    return { error: "Test data seeding is only available in development." };
  }

  const permError = await requireWriteAccess();
  if (permError) return permError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const result: SeedTestDataResult = {
    created: { creators: 0, sponsors: 0, opportunities: 0 },
    skipped: { creators: false, sponsors: false, opportunities: false },
    message: "",
  };

  const { data: existingCreators } = await supabase
    .from("creators")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("notes", SEED_MARKER);

  if (existingCreators?.length) {
    result.skipped.creators = true;
  } else {
    const { error } = await supabase
      .from("creators")
      .insert(getSeedCreatorRows(organizationId));

    if (error) return { error: error.message };
    result.created.creators = 3;
  }

  const { data: existingSponsors } = await supabase
    .from("sponsors")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("internal_notes", SEED_MARKER);

  if (existingSponsors?.length) {
    result.skipped.sponsors = true;
  } else {
    const { error } = await supabase
      .from("sponsors")
      .insert(getSeedSponsorRow(organizationId));

    if (error) return { error: error.message };
    result.created.sponsors = 1;
  }

  const { data: existingOpportunities } = await supabase
    .from("opportunities")
    .select("id, title")
    .eq("organization_id", organizationId);

  const hasSeedOpportunity = (existingOpportunities ?? []).some((row) =>
    isSeedOpportunityTitle(row.title)
  );

  if (hasSeedOpportunity) {
    result.skipped.opportunities = true;
  } else {
    const { error } = await supabase
      .from("opportunities")
      .insert(getSeedOpportunityRow(organizationId));

    if (error) return { error: error.message };
    result.created.opportunities = 1;
  }

  const parts: string[] = [];
  if (result.created.creators) parts.push(`${result.created.creators} creators`);
  if (result.created.sponsors) parts.push(`${result.created.sponsors} sponsor`);
  if (result.created.opportunities) {
    parts.push(`${result.created.opportunities} opportunity`);
  }

  const skippedParts: string[] = [];
  if (result.skipped.creators) skippedParts.push("creators");
  if (result.skipped.sponsors) skippedParts.push("sponsor");
  if (result.skipped.opportunities) skippedParts.push("opportunity");

  if (parts.length === 0 && skippedParts.length > 0) {
    result.message = `Test data already exists (${skippedParts.join(", ")}).`;
  } else if (parts.length > 0 && skippedParts.length > 0) {
    result.message = `Added ${parts.join(", ")}. Skipped existing ${skippedParts.join(", ")}.`;
  } else if (parts.length > 0) {
    result.message = `Added ${parts.join(", ")}.`;
  } else {
    result.message = "Nothing to seed.";
  }

  revalidatePath("/");
  revalidatePath("/creators");
  revalidatePath("/sponsors");
  revalidatePath("/opportunities");

  return result;
}
