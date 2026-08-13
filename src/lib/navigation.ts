import { STAFF_DASHBOARD_PATH } from "@/lib/routes";
import {
  aiFeatureKeys,
  navItemAccessible,
  navFeatureRequirements,
} from "@/lib/subscription/features";
import type { FeatureKey } from "@/lib/subscription/types";
import { staffNavPermissionKeys } from "@/lib/staff/paths";
import {
  canAccessStaffDashboard,
  hasReadAccess,
  isCreatorPortalRole,
  isSponsorPortalRole,
  type TeamRole,
} from "@/lib/team";

export type NavIconName =
  | "dashboard"
  | "users"
  | "building"
  | "target"
  | "file-text"
  | "briefcase"
  | "message-square"
  | "sparkles"
  | "bar-chart"
  | "user-cog"
  | "credit-card"
  | "settings"
  | "calendar"
  | "trophy"
  | "dollar-sign";

export interface NavItem {
  label: string;
  href: string;
  icon: NavIconName;
  showUnreadBadge?: boolean;
  requiredFeature?: FeatureKey | FeatureKey[];
  keywords?: string[];
}

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: STAFF_DASHBOARD_PATH,
    icon: "dashboard",
    keywords: ["home", "overview"],
  },
  {
    label: "Creators",
    href: "/creators",
    icon: "users",
    requiredFeature: navFeatureRequirements["/creators"],
    keywords: ["creator", "roster", "talent"],
  },
  {
    label: "Sponsors",
    href: "/sponsors",
    icon: "building",
    requiredFeature: navFeatureRequirements["/sponsors"],
    keywords: ["sponsor", "brand", "partner"],
  },
  {
    label: "Campaigns",
    href: "/campaigns",
    icon: "target",
    requiredFeature: navFeatureRequirements["/campaigns"],
    keywords: ["campaign", "activation"],
  },
  {
    label: "Deals",
    href: "/contracts",
    icon: "file-text",
    requiredFeature: navFeatureRequirements["/contracts"],
    keywords: ["deal", "deals", "contract", "agreement"],
  },
  {
    label: "Opportunities",
    href: "/opportunities",
    icon: "briefcase",
    requiredFeature: navFeatureRequirements["/opportunities"],
    keywords: ["opportunity", "brief", "listing"],
  },
  {
    label: "Messages",
    href: "/messages",
    icon: "message-square",
    showUnreadBadge: true,
    requiredFeature: navFeatureRequirements["/messages"],
    keywords: ["message", "chat", "inbox"],
  },
  {
    label: "Schedule",
    href: "/schedule",
    icon: "calendar",
    keywords: ["schedule", "calendar", "events"],
  },
  {
    label: "AI",
    href: "/ai",
    icon: "sparkles",
    requiredFeature: aiFeatureKeys,
    keywords: ["ai", "assistant", "insights"],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: "bar-chart",
    requiredFeature: ["advanced_analytics", "monthly_reports"],
    keywords: ["report", "analytics", "metrics"],
  },
  {
    label: "Team",
    href: "/team",
    icon: "user-cog",
    requiredFeature: navFeatureRequirements["/team"],
    keywords: ["team", "members", "invite"],
  },
  {
    label: "Billing",
    href: "/billing",
    icon: "credit-card",
    keywords: ["billing", "payout", "payment", "subscription", "invoice"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: "settings",
    keywords: ["settings", "preferences", "workspace"],
  },
];

export const portalNavItems: NavItem[] = [
  {
    label: "Home",
    href: "/portal",
    icon: "dashboard",
    keywords: ["home", "portal"],
  },
  {
    label: "Revenue",
    href: "/portal/revenue",
    icon: "dollar-sign",
    keywords: ["revenue", "earnings", "payout", "money", "income"],
  },
  {
    label: "Schedule",
    href: "/schedule",
    icon: "calendar",
    keywords: ["schedule", "calendar", "events"],
  },
  {
    label: "My Profile",
    href: "/portal/profile",
    icon: "users",
    keywords: ["profile", "account", "platforms"],
  },
  {
    label: "Deals",
    href: "/contracts",
    icon: "file-text",
    requiredFeature: navFeatureRequirements["/contracts"],
    keywords: ["deal", "deals", "contract", "agreement"],
  },
  {
    label: "Messages",
    href: "/portal/messages",
    icon: "message-square",
    showUnreadBadge: true,
    requiredFeature: navFeatureRequirements["/messages"],
    keywords: ["message", "chat", "inbox"],
  },
  {
    label: "Account",
    href: "/portal/account",
    icon: "settings",
    keywords: ["account", "settings", "billing"],
  },
];

export const sponsorPortalNavItems: NavItem[] = [
  {
    label: "Home",
    href: "/portal",
    icon: "dashboard",
    keywords: ["home", "portal"],
  },
  {
    label: "Schedule",
    href: "/schedule",
    icon: "calendar",
    keywords: ["schedule", "calendar", "events"],
  },
  {
    label: "Company",
    href: "/portal/profile",
    icon: "building",
    keywords: ["company", "profile", "brand"],
  },
  {
    label: "Deals",
    href: "/contracts",
    icon: "file-text",
    requiredFeature: navFeatureRequirements["/contracts"],
    keywords: ["deal", "deals", "contract"],
  },
  {
    label: "Campaigns",
    href: "/campaigns",
    icon: "target",
    requiredFeature: navFeatureRequirements["/campaigns"],
    keywords: ["campaign", "activation"],
  },
  {
    label: "Messages",
    href: "/portal/messages",
    icon: "message-square",
    showUnreadBadge: true,
    requiredFeature: navFeatureRequirements["/messages"],
    keywords: ["message", "chat", "inbox"],
  },
  {
    label: "Account",
    href: "/portal/account",
    icon: "settings",
    keywords: ["account", "settings"],
  },
];

export function getAccessibleNavItems(
  features: Set<FeatureKey>,
  role?: TeamRole | null,
  options?: { isWorkspaceFounder?: boolean }
): NavItem[] {
  let items =
    role && isSponsorPortalRole(role)
      ? [...sponsorPortalNavItems]
      : role && !canAccessStaffDashboard(role)
        ? [...portalNavItems]
        : navItems;

  if (role && isCreatorPortalRole(role) && !canAccessStaffDashboard(role)) {
    const campaignsItem = navItems.find((item) => item.href === "/campaigns");
    if (campaignsItem && !items.some((item) => item.href === "/campaigns")) {
      const messagesIndex = items.findIndex(
        (item) => item.href === "/portal/messages"
      );
      if (messagesIndex >= 0) {
        items = [
          ...items.slice(0, messagesIndex),
          campaignsItem,
          ...items.slice(messagesIndex),
        ];
      }
    }

    const opportunitiesItem = navItems.find(
      (item) => item.href === "/opportunities"
    );
    if (
      opportunitiesItem &&
      !items.some((item) => item.href === "/opportunities")
    ) {
      const messagesIndex = items.findIndex(
        (item) => item.href === "/portal/messages"
      );
      if (messagesIndex >= 0) {
        items = [
          ...items.slice(0, messagesIndex),
          opportunitiesItem,
          ...items.slice(messagesIndex),
        ];
      }
    }

    const applicationsItem: NavItem = {
      label: "My applications",
      href: "/opportunities/applications",
      icon: "briefcase",
      keywords: ["applications", "applied", "submissions"],
    };
    if (!items.some((item) => item.href === "/opportunities/applications")) {
      const opportunitiesIndex = items.findIndex(
        (item) => item.href === "/opportunities"
      );
      if (opportunitiesIndex >= 0) {
        items = [
          ...items.slice(0, opportunitiesIndex + 1),
          applicationsItem,
          ...items.slice(opportunitiesIndex + 1),
        ];
      }
    }

    const deliverablesItem: NavItem = {
      label: "Deliverables",
      href: "/portal/deliverables",
      icon: "file-text",
      keywords: ["deliverable", "deliverables", "tasks"],
    };
    if (!items.some((item) => item.href === "/portal/deliverables")) {
      const contractsIndex = items.findIndex((item) => item.href === "/contracts");
      if (contractsIndex >= 0) {
        items = [
          ...items.slice(0, contractsIndex + 1),
          deliverablesItem,
          ...items.slice(contractsIndex + 1),
        ];
      }
    }

    const growthItem: NavItem = {
      label: "Growth",
      href: "/portal/growth",
      icon: "bar-chart",
      keywords: ["growth", "analytics", "performance"],
    };
    if (!items.some((item) => item.href === "/portal/growth")) {
      const homeIndex = items.findIndex((item) => item.href === "/portal");
      if (homeIndex >= 0) {
        items = [
          ...items.slice(0, homeIndex + 1),
          growthItem,
          ...items.slice(homeIndex + 1),
        ];
      }
    }

    const coachItem: NavItem = {
      label: "Coach",
      href: "/portal/coach",
      icon: "sparkles",
      keywords: ["coach", "ai", "cadence", "posting"],
    };
    if (!items.some((item) => item.href === "/portal/coach")) {
      const growthIndex = items.findIndex((item) => item.href === "/portal/growth");
      const insertIndex = growthIndex >= 0 ? growthIndex : 1;
      items = [
        ...items.slice(0, insertIndex),
        coachItem,
        ...items.slice(insertIndex),
      ];
    }

    const seasonsItem: NavItem = {
      label: "Seasons",
      href: "/portal/seasons",
      icon: "trophy",
      keywords: ["seasons", "xp", "rewards"],
    };
    if (!items.some((item) => item.href === "/portal/seasons")) {
      const growthIndex = items.findIndex((item) => item.href === "/portal/growth");
      const insertIndex = growthIndex >= 0 ? growthIndex + 1 : 1;
      items = [
        ...items.slice(0, insertIndex),
        seasonsItem,
        ...items.slice(insertIndex),
      ];
    }

    if (options?.isWorkspaceFounder) {
      const workspaceAdminItems: NavItem[] = [
        {
          label: "Settings",
          href: "/settings",
          icon: "settings",
          keywords: ["settings", "ai", "integration", "api key"],
        },
        {
          label: "Billing",
          href: "/billing",
          icon: "credit-card",
          keywords: ["billing", "plan", "subscription", "upgrade"],
        },
      ];

      for (const adminItem of workspaceAdminItems) {
        if (!items.some((item) => item.href === adminItem.href)) {
          const accountIndex = items.findIndex(
            (item) => item.href === "/portal/account"
          );
          const insertIndex =
            accountIndex >= 0 ? accountIndex : items.length;
          items = [
            ...items.slice(0, insertIndex),
            adminItem,
            ...items.slice(insertIndex),
          ];
        }
      }
    }
  }

  return items
    .filter((item) => navItemAccessible(features, item.requiredFeature))
    .filter((item) => {
      if (!role || !canAccessStaffDashboard(role)) return true;
      const permissionKey = staffNavPermissionKeys[item.href];
      if (!permissionKey) return true;
      return hasReadAccess(role, permissionKey);
    });
}

export function getActiveNavHref(
  pathname: string,
  items: NavItem[]
): string | null {
  const matching = items
    .filter((item) => {
      if (item.href === STAFF_DASHBOARD_PATH) {
        return pathname === STAFF_DASHBOARD_PATH;
      }
      if (item.href === "/portal") {
        return pathname === "/portal";
      }
      if (item.href === "/portal/profile") {
        return (
          pathname.startsWith("/creators/") || pathname === "/portal/profile"
        );
      }
      return (
        pathname === item.href || pathname.startsWith(`${item.href}/`)
      );
    })
    .sort((a, b) => b.href.length - a.href.length);

  return matching[0]?.href ?? null;
}
