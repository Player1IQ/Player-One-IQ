import type { SearchResult, SearchResultType } from "./queries";

function matchScore(item: SearchResult, query: string): number {
  const label = item.label.toLowerCase();
  const subtitle = item.subtitle.toLowerCase();

  if (label === query) return 100;
  if (label.startsWith(query)) return 80;
  if (label.includes(query)) return 60;
  if (subtitle.includes(query)) return 40;
  if (item.type.includes(query)) return 20;
  return 0;
}

export function filterSearchResults(
  items: SearchResult[],
  query: string,
  limitPerType = 5
): SearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return items.slice(0, limitPerType * 3);
  }

  const order: SearchResultType[] = ["contract", "creator", "sponsor"];

  return order.flatMap((type) =>
    items
      .filter((item) => item.type === type)
      .map((item) => ({ item, score: matchScore(item, normalized) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limitPerType)
      .map(({ item }) => item)
  );
}

export const searchTypeLabels: Record<SearchResult["type"], string> = {
  creator: "Creator",
  sponsor: "Sponsor",
  contract: "Contract",
};
