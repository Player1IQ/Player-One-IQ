import enCommandPalette from "../../../messages/en/commandPalette.json";
import { navItemAccessible } from "@/lib/subscription/features";
import type { FeatureKey } from "@/lib/subscription/types";
import {
  canAccessStaffDashboard,
  hasFullAccess,
  hasReadAccess,
  isCreatorPortalRole,
  isSponsorPortalRole,
  type PermissionKey,
  type TeamRole,
} from "@/lib/team";
import type { CommandPaletteItem } from "./types";

export type ActionAudience =
  | "staff"
  | "creator_portal"
  | "sponsor_portal"
  | "all_authenticated";

interface CommandActionDefinition {
  id: string;
  href: string;
  keywords: string[];
  audience: ActionAudience[];
  requiredFeature?: FeatureKey | FeatureKey[];
  requiredPermission?: PermissionKey;
  requiresWrite?: boolean;
}

const actionDefinitions: CommandActionDefinition[] = [
  {
    id: "create-deal",
    href: "/contracts?create=true",
    keywords: ["contract", "deal", "agreement", "new deal"],
    audience: ["staff"],
    requiredFeature: "contracts",
    requiredPermission: "contracts",
    requiresWrite: true,
  },
  {
    id: "create-creator",
    href: "/creators?create=true",
    keywords: ["creator", "roster", "talent", "new creator"],
    audience: ["staff"],
    requiredFeature: "creator_profiles",
    requiredPermission: "creators",
    requiresWrite: true,
  },
  {
    id: "create-sponsor",
    href: "/sponsors?create=true",
    keywords: ["sponsor", "brand", "partner", "new sponsor"],
    audience: ["staff"],
    requiredFeature: "sponsor_crm",
    requiredPermission: "sponsors",
    requiresWrite: true,
  },
  {
    id: "create-campaign",
    href: "/campaigns?create=true",
    keywords: ["campaign", "activation", "new campaign"],
    audience: ["staff"],
    requiredFeature: "campaign_tracking",
    requiredPermission: "campaigns",
    requiresWrite: true,
  },
  {
    id: "create-opportunity",
    href: "/opportunities?create=true",
    keywords: ["opportunity", "brief", "listing", "new opportunity"],
    audience: ["staff"],
    requiredFeature: "create_opportunities",
    requiredPermission: "opportunities",
    requiresWrite: true,
  },
  {
    id: "invite-team",
    href: "/team?create=true",
    keywords: ["invite", "team", "member", "user"],
    audience: ["staff"],
    requiredFeature: "team_management",
    requiredPermission: "team",
    requiresWrite: true,
  },
  {
    id: "new-message",
    href: "/messages?create=true",
    keywords: ["message", "chat", "inbox", "dm", "conversation"],
    audience: ["all_authenticated"],
    requiredFeature: "messaging",
  },
  {
    id: "view-reports",
    href: "/reports",
    keywords: ["report", "analytics", "export", "metrics"],
    audience: ["staff"],
    requiredFeature: ["advanced_analytics", "monthly_reports"],
    requiredPermission: "reports",
  },
  {
    id: "open-ai",
    href: "/ai",
    keywords: ["ai", "assistant", "insights", "recommendations"],
    audience: ["staff"],
    requiredPermission: "ai",
  },
  {
    id: "manage-billing",
    href: "/billing",
    keywords: ["billing", "payout", "payment", "subscription", "invoice"],
    audience: ["staff"],
    requiredPermission: "billing",
  },
  {
    id: "update-profile",
    href: "/portal/profile",
    keywords: ["profile", "account", "platforms", "social"],
    audience: ["creator_portal"],
  },
  {
    id: "view-revenue",
    href: "/portal/revenue",
    keywords: ["revenue", "earnings", "payout", "money", "income"],
    audience: ["creator_portal"],
  },
  {
    id: "view-growth",
    href: "/portal/growth",
    keywords: ["growth", "analytics", "performance", "stats"],
    audience: ["creator_portal"],
  },
  {
    id: "view-coach",
    href: "/portal/coach",
    keywords: ["coach", "ai", "cadence", "posting", "tips"],
    audience: ["creator_portal"],
  },
  {
    id: "view-deliverables",
    href: "/portal/deliverables",
    keywords: ["deliverable", "deliverables", "tasks", "content"],
    audience: ["creator_portal"],
    requiredFeature: "contracts",
  },
  {
    id: "browse-opportunities",
    href: "/opportunities",
    keywords: ["opportunity", "apply", "brief", "marketplace"],
    audience: ["creator_portal"],
    requiredFeature: "apply_opportunities",
  },
  {
    id: "update-company",
    href: "/portal/profile",
    keywords: ["company", "profile", "brand", "sponsor"],
    audience: ["sponsor_portal"],
  },
  {
    id: "view-schedule",
    href: "/schedule",
    keywords: ["schedule", "calendar", "events", "booking"],
    audience: ["all_authenticated"],
  },
  {
    id: "org-settings",
    href: "/settings",
    keywords: ["settings", "organization", "workspace", "preferences"],
    audience: ["staff"],
    requiredPermission: "settings",
  },
];

type ActionField = "label" | "subtitle";

type ActionTranslator = (id: string, field: ActionField) => string;

const defaultActionTranslator: ActionTranslator = (id, field) => {
  const action = enCommandPalette.actions[id as keyof typeof enCommandPalette.actions];
  return action?.[field] ?? id;
};

function matchesAudience(
  role: TeamRole | null,
  audience: ActionAudience[]
): boolean {
  if (!role) return false;
  if (audience.includes("all_authenticated")) return true;
  if (audience.includes("staff") && canAccessStaffDashboard(role)) return true;
  if (audience.includes("creator_portal") && isCreatorPortalRole(role)) {
    return true;
  }
  if (audience.includes("sponsor_portal") && isSponsorPortalRole(role)) {
    return true;
  }
  return false;
}

function actionAccessible(
  action: CommandActionDefinition,
  features: Set<FeatureKey>,
  role: TeamRole | null
): boolean {
  if (!matchesAudience(role, action.audience)) return false;

  if (
    action.requiredFeature &&
    !navItemAccessible(features, action.requiredFeature)
  ) {
    return false;
  }

  if (action.requiredPermission && role) {
    if (action.requiresWrite) {
      if (!hasFullAccess(role, action.requiredPermission)) return false;
    } else if (!hasReadAccess(role, action.requiredPermission)) {
      return false;
    }
  }

  return true;
}

export function getAccessibleActions(
  features: Set<FeatureKey>,
  role: TeamRole | null,
  translate: ActionTranslator = defaultActionTranslator
): CommandPaletteItem[] {
  return actionDefinitions
    .filter((action) => actionAccessible(action, features, role))
    .map((action) => ({
      id: action.id,
      section: "action" as const,
      label: translate(action.id, "label"),
      subtitle: translate(action.id, "subtitle"),
      href: action.href,
      keywords: action.keywords,
    }));
}

export { actionDefinitions };
