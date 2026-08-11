import type {
  CommandPaletteIndex,
  CommandPaletteItem,
  FilteredCommandPaletteResults,
} from "./types";

const SECTION_ORDER = ["route", "action", "entity"] as const;

const DEFAULT_LIMITS = {
  route: 8,
  action: 6,
  entity: 8,
} as const;

const FILTERED_LIMITS = {
  route: 5,
  action: 5,
  entity: 8,
} as const;

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s/_-]+/)
    .filter(Boolean);
}

function fuzzyIncludes(haystack: string, needle: string): boolean {
  if (!needle) return true;
  if (haystack.includes(needle)) return true;

  let hayIndex = 0;
  for (const char of needle) {
    hayIndex = haystack.indexOf(char, hayIndex);
    if (hayIndex === -1) return false;
    hayIndex += 1;
  }
  return true;
}

export function scoreCommandPaletteItem(
  item: CommandPaletteItem,
  query: string
): number {
  const normalized = normalizeQuery(query);
  if (!normalized) return 1;

  const label = item.label.toLowerCase();
  const subtitle = item.subtitle.toLowerCase();
  const href = item.href.toLowerCase();
  const keywords = (item.keywords ?? []).map((keyword) =>
    keyword.toLowerCase()
  );

  if (label === normalized) return 100;
  if (keywords.some((keyword) => keyword === normalized)) return 95;
  if (label.startsWith(normalized)) return 85;
  if (keywords.some((keyword) => keyword.startsWith(normalized))) return 80;
  if (label.includes(normalized)) return 70;
  if (keywords.some((keyword) => keyword.includes(normalized))) return 65;
  if (subtitle.includes(normalized)) return 50;
  if (href.includes(normalized)) return 40;

  const queryTokens = tokenize(normalized);
  const searchable = [label, subtitle, href, ...keywords].join(" ");
  const allTokensMatch = queryTokens.every((token) =>
    fuzzyIncludes(searchable, token)
  );
  if (allTokensMatch) return 30;

  if (item.entityType?.includes(normalized)) return 20;
  return 0;
}

function sortSection(
  items: CommandPaletteItem[],
  query: string,
  limit: number
): CommandPaletteItem[] {
  if (!normalizeQuery(query)) {
    return items.slice(0, limit);
  }

  return items
    .map((item) => ({ item, score: scoreCommandPaletteItem(item, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label))
    .slice(0, limit)
    .map(({ item }) => item);
}

export function filterCommandPaletteResults(
  index: CommandPaletteIndex,
  query: string
): FilteredCommandPaletteResults {
  const normalized = normalizeQuery(query);
  const limits = normalized ? FILTERED_LIMITS : DEFAULT_LIMITS;

  const routes = sortSection(index.routes, query, limits.route);
  const actions = sortSection(index.actions, query, limits.action);
  const entities = sortSection(index.entities, query, limits.entity);

  const flat = SECTION_ORDER.flatMap((section) => {
    if (section === "route") return routes;
    if (section === "action") return actions;
    return entities;
  });

  return { routes, actions, entities, flat };
}

export function getSectionLabel(section: CommandPaletteItem["section"]): string {
  switch (section) {
    case "route":
      return "Pages";
    case "action":
      return "Actions";
    case "entity":
      return "Entities";
  }
}
