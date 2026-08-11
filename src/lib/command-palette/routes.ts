import { getAccessibleNavItems } from "@/lib/navigation";
import type { FeatureKey } from "@/lib/subscription/types";
import type { TeamRole } from "@/lib/team";
import type { CommandPaletteItem } from "./types";

export function getCommandPaletteRoutes(
  features: Set<FeatureKey>,
  role: TeamRole | null
): CommandPaletteItem[] {
  return getAccessibleNavItems(features, role).map((item) => ({
    id: `route-${item.href}`,
    section: "route" as const,
    label: item.label,
    subtitle: "Page",
    href: item.href,
    keywords: item.keywords,
  }));
}
