import type { createClient } from "@/lib/supabase/server";

type Supabase = NonNullable<Awaited<ReturnType<typeof createClient>>>;

interface ApplicationContext {
  id: string;
  opportunity_id: string;
  creator_id: string;
  cover_message: string | null;
  proposed_rate: number | null;
  creators: { name: string } | { name: string }[] | null;
  opportunities: {
    title: string;
    budget: number | null;
    category: string;
    deliverables: string | null;
    organization_id: string;
    sponsor_id: string | null;
  } | {
    title: string;
    budget: number | null;
    category: string;
    deliverables: string | null;
    organization_id: string;
    sponsor_id: string | null;
  }[] | null;
}

function relationField<T>(relation: T | T[] | null | undefined): T | null {
  if (!relation) return null;
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

async function resolveSponsorId(
  supabase: Supabase,
  organizationId: string,
  opportunitySponsorId: string | null,
  category: string
): Promise<string | null> {
  if (opportunitySponsorId) {
    const { data: linkedSponsor } = await supabase
      .from("sponsors")
      .select("id")
      .eq("id", opportunitySponsorId)
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .maybeSingle();

    if (linkedSponsor) return linkedSponsor.id;
  }

  const { data: sponsors } = await supabase
    .from("sponsors")
    .select("id, industry")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (!sponsors?.length) return null;

  const matched = sponsors.find((sponsor) => sponsor.industry === category);
  return matched?.id ?? sponsors[0].id;
}

export async function createDraftContractFromApplication(
  supabase: Supabase,
  organizationId: string,
  applicationId: string
): Promise<{ contractId: string } | { error: string }> {
  const { data: existing } = await supabase
    .from("contracts")
    .select("id")
    .eq("source_application_id", applicationId)
    .maybeSingle();

  if (existing) return { contractId: existing.id };

  const { data: application, error: fetchError } = await supabase
    .from("opportunity_applications")
    .select(
      `id, opportunity_id, creator_id, cover_message, proposed_rate,
      creators ( name ),
      opportunities ( title, budget, category, deliverables, organization_id, sponsor_id )`
    )
    .eq("id", applicationId)
    .maybeSingle();

  if (fetchError || !application) {
    return { error: "Application not found." };
  }

  const row = application as ApplicationContext;
  const opportunity = relationField(row.opportunities);
  const creator = relationField(row.creators);

  if (!opportunity || opportunity.organization_id !== organizationId) {
    return { error: "Application not found." };
  }

  const sponsorId = await resolveSponsorId(
    supabase,
    organizationId,
    opportunity.sponsor_id,
    opportunity.category
  );

  if (!sponsorId) {
    return {
      error:
        "Link an active sponsor to this opportunity before accepting applications.",
    };
  }

  const proposedRate =
    row.proposed_rate !== null ? Number(row.proposed_rate) : null;
  const budget =
    opportunity.budget !== null ? Number(opportunity.budget) : null;
  const contractValue = proposedRate ?? budget ?? 0;
  const creatorName = creator?.name ?? "Creator";

  const noteLines = [
    `Created from opportunity: ${opportunity.title}`,
    row.cover_message ? `Application cover message:\n${row.cover_message}` : null,
  ].filter(Boolean);

  const { data: contract, error: insertError } = await supabase
    .from("contracts")
    .insert({
      organization_id: organizationId,
      creator_id: row.creator_id,
      sponsor_id: sponsorId,
      contract_name: `${opportunity.title} — ${creatorName}`,
      contract_value: contractValue,
      contract_status: "draft",
      deliverables: opportunity.deliverables?.trim() || null,
      notes: noteLines.join("\n\n"),
      source_opportunity_id: row.opportunity_id,
      source_application_id: applicationId,
    })
    .select("id")
    .single();

  if (insertError || !contract) {
    return { error: insertError?.message ?? "Failed to create contract." };
  }

  await supabase.from("activity_log").insert({
    organization_id: organizationId,
    entity_type: "contract",
    entity_id: contract.id,
    action: "created",
    summary: "Draft contract created from opportunity",
    detail: `${opportunity.title} — ${creatorName}`,
  });

  return { contractId: contract.id };
}
