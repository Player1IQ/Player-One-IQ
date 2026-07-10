import { createClient } from "@/lib/supabase/server";

/** Ensures Brand / Sponsor workspaces have a sponsors-row brand profile for campaigns. */
export async function ensureSponsorBrandProfile(): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("ensure_sponsor_brand_profile");

  if (error) {
    console.error("ensure_sponsor_brand_profile failed:", error.message);
    return null;
  }

  return typeof data === "string" ? data : null;
}
