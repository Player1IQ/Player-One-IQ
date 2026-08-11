import { getCurrentUserRole } from "@/lib/permissions";
import { getSubscriptionContext } from "@/lib/subscription/queries";
import { getAccessibleActions } from "./registry";
import { getCommandPaletteRoutes } from "./routes";
import { getCommandPaletteEntities } from "./entities";
import type { CommandPaletteIndex } from "./types";

export type {
  CommandPaletteIndex,
  CommandPaletteItem,
  CommandPaletteSection,
  EntityType,
  FilteredCommandPaletteResults,
} from "./types";

export {
  filterCommandPaletteResults,
  getSectionLabel,
  scoreCommandPaletteItem,
} from "./filter";
export { getAccessibleActions, actionDefinitions } from "./registry";
export { getCommandPaletteRoutes } from "./routes";
export { getCommandPaletteEntities } from "./entities";

export async function getCommandPaletteIndex(): Promise<CommandPaletteIndex> {
  const [role, subscriptionContext] = await Promise.all([
    getCurrentUserRole(),
    getSubscriptionContext(),
  ]);

  const features = subscriptionContext.features;

  const [entities] = await Promise.all([
    getCommandPaletteEntities(role),
  ]);

  return {
    routes: getCommandPaletteRoutes(features, role),
    actions: getAccessibleActions(features, role),
    entities,
  };
}
