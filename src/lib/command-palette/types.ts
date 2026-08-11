export type CommandPaletteSection = "route" | "action" | "entity";

export type EntityType =
  | "creator"
  | "sponsor"
  | "contract"
  | "campaign"
  | "opportunity"
  | "message";

export interface CommandPaletteItem {
  id: string;
  section: CommandPaletteSection;
  label: string;
  subtitle: string;
  href: string;
  keywords?: string[];
  entityType?: EntityType;
}

export interface CommandPaletteIndex {
  routes: CommandPaletteItem[];
  actions: CommandPaletteItem[];
  entities: CommandPaletteItem[];
}

export interface ScoredCommandPaletteItem extends CommandPaletteItem {
  score: number;
}

export interface FilteredCommandPaletteResults {
  routes: CommandPaletteItem[];
  actions: CommandPaletteItem[];
  entities: CommandPaletteItem[];
  flat: CommandPaletteItem[];
}
