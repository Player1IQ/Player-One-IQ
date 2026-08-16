import { getTranslations } from "next-intl/server";
import { getCurrentUserRole } from "@/lib/permissions";
import { getSubscriptionContext } from "@/lib/subscription/queries";
import type { NavLabelKey } from "@/lib/navigation";
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
  const [role, subscriptionContext, tNav, tCommandPalette] = await Promise.all([
    getCurrentUserRole(),
    getSubscriptionContext(),
    getTranslations("nav"),
    getTranslations("commandPalette"),
  ]);

  const features = subscriptionContext.features;

  const [entities] = await Promise.all([
    getCommandPaletteEntities(role),
  ]);

  const translateAction = (
    id: string,
    field: "label" | "subtitle"
  ): string =>
    tCommandPalette(
      `actions.${id}.${field}` as Parameters<typeof tCommandPalette>[0]
    );

  return {
    routes: getCommandPaletteRoutes(
      features,
      role,
      (labelKey) => tNav(`items.${labelKey as NavLabelKey}`),
      tNav("pageSubtitle")
    ),
    actions: getAccessibleActions(features, role, translateAction),
    entities,
  };
}
