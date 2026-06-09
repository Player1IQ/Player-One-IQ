import { getCreators } from "@/lib/creators/queries";
import { getSponsors } from "@/lib/sponsors/queries";
import { getContracts } from "@/lib/contracts/queries";
import { contractStatusLabels } from "@/lib/contracts";

export type SearchResultType = "creator" | "sponsor" | "contract";

export interface SearchResult {
  type: SearchResultType;
  id: string;
  label: string;
  subtitle: string;
  href: string;
}

export async function getSearchIndex(): Promise<SearchResult[]> {
  const [creators, sponsors, contracts] = await Promise.all([
    getCreators(),
    getSponsors(),
    getContracts(),
  ]);

  const creatorResults: SearchResult[] = creators.map((creator) => ({
    type: "creator",
    id: creator.id,
    label: creator.name,
    subtitle: creator.email || creator.primaryPlatform,
    href: `/creators/${creator.id}`,
  }));

  const sponsorResults: SearchResult[] = sponsors.map((sponsor) => ({
    type: "sponsor",
    id: sponsor.id,
    label: sponsor.companyName,
    subtitle: sponsor.industry,
    href: `/sponsors/${sponsor.id}`,
  }));

  const contractResults: SearchResult[] = contracts.map((contract) => ({
    type: "contract",
    id: contract.id,
    label: contract.contractName,
    subtitle: `${contract.creatorName} × ${contract.sponsorName} · ${contractStatusLabels[contract.status]}`,
    href: `/contracts/${contract.id}`,
  }));

  return [...creatorResults, ...sponsorResults, ...contractResults];
}
