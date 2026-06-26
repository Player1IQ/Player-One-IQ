import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import { mapSponsorRow, type Sponsor, type SponsorRow } from "./types";

export async function getSponsors(): Promise<Sponsor[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from("sponsors")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as SponsorRow[]).map(mapSponsorRow);
}

export async function getSponsorById(id: string): Promise<Sponsor | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const organizationId = await getOrganizationId();
  if (!organizationId) return null;

  const { data, error } = await supabase
    .from("sponsors")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) return null;
  return mapSponsorRow(data as SponsorRow);
}
