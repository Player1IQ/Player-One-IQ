import type { Creator } from "@/lib/creators";

export interface CampaignCreatorAssignment {
  campaignId: string;
  creatorId: string;
  creatorName: string;
}

export interface CampaignCreatorRow {
  campaign_id: string;
  creator_id: string;
  organization_id: string;
  creators?: { name: string } | { name: string }[] | null;
}

export function mapCampaignCreatorRow(row: CampaignCreatorRow): CampaignCreatorAssignment {
  const creator = Array.isArray(row.creators) ? row.creators[0] : row.creators;

  return {
    campaignId: row.campaign_id,
    creatorId: row.creator_id,
    creatorName: creator?.name ?? "Unknown creator",
  };
}

export function toCampaignCreatorSummaries(
  assignments: CampaignCreatorAssignment[]
): Pick<Creator, "id" | "name">[] {
  const seen = new Set<string>();

  return assignments
    .filter((assignment) => {
      if (seen.has(assignment.creatorId)) return false;
      seen.add(assignment.creatorId);
      return true;
    })
    .map((assignment) => ({
      id: assignment.creatorId,
      name: assignment.creatorName,
    }));
}
