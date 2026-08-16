import enNav from "../../../messages/en/nav.json";
import { getAccessibleNavItems } from "@/lib/navigation";
import type { FeatureKey } from "@/lib/subscription/types";
import type { TeamRole } from "@/lib/team";
import type { CommandPaletteItem } from "./types";

type NavLabelTranslator = (labelKey: string) => string;

const defaultNavLabelTranslator: NavLabelTranslator = (labelKey) =>
  enNav.items[labelKey as keyof typeof enNav.items] ?? labelKey;

export function getCommandPaletteRoutes(
  features: Set<FeatureKey>,
  role: TeamRole | null,
  translateLabel: NavLabelTranslator = defaultNavLabelTranslator,
  pageSubtitle: string = enNav.pageSubtitle
): CommandPaletteItem[] {
  return getAccessibleNavItems(features, role).map((item) => ({
    id: `route-${item.href}`,
    section: "route" as const,
    label: translateLabel(item.labelKey),
    subtitle: pageSubtitle,
    href: item.href,
    keywords: item.keywords,
  }));
}
