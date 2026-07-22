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
  | "calendar";

export interface NavItem {
  label: string;
  href: string;
  icon: NavIconName;
  showUnreadBadge?: boolean;
  requiredFeature?: FeatureKey | FeatureKey[];
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: STAFF_DASHBOARD_PATH, icon: "dashboard" },
  {
    label: "Creators",
    href: "/creators",
    icon: "users",
    requiredFeature: navFeatureRequirements["/creators"],
  },
  {
    label: "Sponsors",
    href: "/sponsors",
    icon: "building",
    requiredFeature: navFeatureRequirements["/sponsors"],
  },
  {
    label: "Campaigns",
    href: "/campaigns",
    icon: "target",
    requiredFeature: navFeatureRequirements["/campaigns"],
  },
  {
    label: "Contracts",
    href: "/contracts",
    icon: "file-text",
    requiredFeature: navFeatureRequirements["/contracts"],
  },
  {
    label: "Opportunities",
    href: "/opportunities",
    icon: "briefcase",
    requiredFeature: navFeatureRequirements["/opportunities"],
  },
  {
    label: "Messages",
    href: "/messages",
    icon: "message-square",
    showUnreadBadge: true,
    requiredFeature: navFeatureRequirements["/messages"],
  },
  { label: "Schedule", href: "/schedule", icon: "calendar" },
  {
    label: "AI",
    href: "/ai",
    icon: "sparkles",
    requiredFeature: aiFeatureKeys,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: "bar-chart",
    requiredFeature: ["advanced_analytics", "monthly_reports"],
  },
  {
    label: "Team",
    href: "/team",
    icon: "user-cog",
    requiredFeature: navFeatureRequirements["/team"],
  },
  { label: "Billing", href: "/billing", icon: "credit-card" },
  { label: "Settings", href: "/settings", icon: "settings" },
];

export const portalNavItems: NavItem[] = [
  { label: "Home", href: "/portal", icon: "dashboard" },
  { label: "Schedule", href: "/schedule", icon: "calendar" },
  { label: "My Profile", href: "/portal/profile", icon: "users" },
  {
    label: "Contracts",
    href: "/contracts",
    icon: "file-text",
    requiredFeature: navFeatureRequirements["/contracts"],
  },
  {
    label: "Messages",
    href: "/messages",
    icon: "message-square",
    showUnreadBadge: true,
    requiredFeature: navFeatureRequirements["/messages"],
  },
  { label: "Account", href: "/portal/account", icon: "settings" },
];

export const sponsorPortalNavItems: NavItem[] = [
  { label: "Home", href: "/portal", icon: "dashboard" },
  { label: "Schedule", href: "/schedule", icon: "calendar" },
  { label: "Company", href: "/portal/profile", icon: "building" },
  {
    label: "Contracts",
    href: "/contracts",
    icon: "file-text",
    requiredFeature: navFeatureRequirements["/contracts"],
  },
  {
    label: "Campaigns",
    href: "/campaigns",
    icon: "target",
    requiredFeature: navFeatureRequirements["/campaigns"],
  },
  {
    label: "Messages",
    href: "/messages",
    icon: "message-square",
    showUnreadBadge: true,
    requiredFeature: navFeatureRequirements["/messages"],
  },
  { label: "Account", href: "/portal/account", icon: "settings" },
];

export function getAccessibleNavItems(
  features: Set<FeatureKey>,
  role?: TeamRole | null
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
      const messagesIndex = items.findIndex((item) => item.href === "/messages");
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
      const messagesIndex = items.findIndex((item) => item.href === "/messages");
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
