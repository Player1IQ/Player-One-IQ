import {
  aiFeatureKeys,
  navItemAccessible,
  navFeatureRequirements,
} from "@/lib/subscription/features";
import type { FeatureKey } from "@/lib/subscription/types";
import { canAccessStaffDashboard, type TeamRole } from "@/lib/team";

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
  | "settings";

export interface NavItem {
  label: string;
  href: string;
  icon: NavIconName;
  showUnreadBadge?: boolean;
  requiredFeature?: FeatureKey | FeatureKey[];
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "dashboard" },
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

export function getAccessibleNavItems(
  features: Set<FeatureKey>,
  role?: TeamRole | null
): NavItem[] {
  let items =
    role && !canAccessStaffDashboard(role) ? [...portalNavItems] : navItems;

  if (role === "content_creator" && !canAccessStaffDashboard(role)) {
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
  }

  return items.filter((item) =>
    navItemAccessible(features, item.requiredFeature)
  );
}
