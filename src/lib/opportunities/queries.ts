import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import {
  mapApplicationRow,
  mapOpportunityRow,
  type ApplicationRow,
  type Opportunity,
  type OpportunityApplication,
  type OpportunityRow,
} from "@/lib/opportunities";

async function getContractIdsByApplicationIds(
  applicationIds: string[]
): Promise<Record<string, string>> {
  if (applicationIds.length === 0) return {};

  const supabase = await createClient();
  if (!supabase) return {};

  const { data } = await supabase
    .from("contracts")
    .select("id, source_application_id")
    .in("source_application_id", applicationIds);

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.source_application_id) {
      map[row.source_application_id] = row.id;
    }
  }
  return map;
}

async function countApplicationsByOpportunity(
  opportunityIds: string[]
): Promise<Record<string, number>> {
  if (opportunityIds.length === 0) return {};

  const supabase = await createClient();
  if (!supabase) return {};

  const { data } = await supabase
    .from("opportunity_applications")
    .select("opportunity_id")
    .in("opportunity_id", opportunityIds);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.opportunity_id] = (counts[row.opportunity_id] ?? 0) + 1;
  }
  return counts;
}

export async function getOpportunities(): Promise<Opportunity[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from("opportunities")
    .select("*, sponsors ( company_name )")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const rows = data as OpportunityRow[];
  const counts = await countApplicationsByOpportunity(rows.map((r) => r.id));

  return rows.map((row) =>
    mapOpportunityRow(row, counts[row.id] ?? 0)
  );
}

export async function getOpportunityById(
  id: string
): Promise<Opportunity | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("opportunities")
    .select("*, sponsors ( company_name )")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const counts = await countApplicationsByOpportunity([data.id]);
  return mapOpportunityRow(data as OpportunityRow, counts[data.id] ?? 0);
}

export async function getApplicationsForOpportunity(
  opportunityId: string
): Promise<OpportunityApplication[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id")
    .eq("id", opportunityId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!opportunity) return [];

  const { data, error } = await supabase
    .from("opportunity_applications")
    .select(
      `*,
      creators ( name ),
      opportunities ( title, status )`
    )
    .eq("opportunity_id", opportunityId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const rows = data as ApplicationRow[];
  const contractIds = await getContractIdsByApplicationIds(
    rows.map((row) => row.id)
  );

  return rows.map((row) => mapApplicationRow(row, contractIds[row.id] ?? null));
}

export async function getAllApplications(): Promise<OpportunityApplication[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("id")
    .eq("organization_id", organizationId);

  if (!opportunities?.length) return [];

  const ids = opportunities.map((o) => o.id);

  const { data, error } = await supabase
    .from("opportunity_applications")
    .select(
      `*,
      creators ( name ),
      opportunities ( title, status )`
    )
    .in("opportunity_id", ids)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const rows = data as ApplicationRow[];
  const contractIds = await getContractIdsByApplicationIds(
    rows.map((row) => row.id)
  );

  return rows.map((row) => mapApplicationRow(row, contractIds[row.id] ?? null));
}

export async function getAgencyOpenOpportunitiesForPortal(): Promise<Opportunity[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from("opportunities")
    .select("*, sponsors ( company_name )")
    .eq("organization_id", organizationId)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const rows = data as OpportunityRow[];
  return rows.map((row) => mapOpportunityRow(row, 0));
}

export async function getMarketplaceOpportunities(): Promise<Opportunity[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from("opportunities")
    .select("*, sponsors ( company_name )")
    .eq("marketplace_listing", true)
    .eq("status", "open")
    .neq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const rows = data as OpportunityRow[];
  return rows.map((row) => mapOpportunityRow(row, 0));
}

export async function getOpenOpportunitiesForPortal(): Promise<Opportunity[]> {
  const [agency, marketplace] = await Promise.all([
    getAgencyOpenOpportunitiesForPortal(),
    getMarketplaceOpportunities(),
  ]);

  const seen = new Set(agency.map((opportunity) => opportunity.id));
  const merged = [...agency];
  for (const opportunity of marketplace) {
    if (!seen.has(opportunity.id)) {
      merged.push(opportunity);
    }
  }
  return merged;
}

export async function getApplicationsForCreator(
  creatorId: string
): Promise<OpportunityApplication[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("opportunity_applications")
    .select(
      `*,
      creators ( name ),
      opportunities ( title, status )`
    )
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const rows = data as ApplicationRow[];
  const contractIds = await getContractIdsByApplicationIds(
    rows.map((row) => row.id)
  );

  return rows.map((row) => mapApplicationRow(row, contractIds[row.id] ?? null));
}

export async function getApplicationForCreatorOnOpportunity(
  opportunityId: string,
  creatorId: string
): Promise<OpportunityApplication | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("opportunity_applications")
    .select(
      `*,
      creators ( name ),
      opportunities ( title, status )`
    )
    .eq("opportunity_id", opportunityId)
    .eq("creator_id", creatorId)
    .maybeSingle();

  if (error || !data) return null;

  const contractIds = await getContractIdsByApplicationIds([data.id]);
  return mapApplicationRow(data as ApplicationRow, contractIds[data.id] ?? null);
}

export async function getOpportunityActivity(limit = 5) {
  const supabase = await createClient();
  if (!supabase) return [];

  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("entity_type", "opportunity")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data;
}
