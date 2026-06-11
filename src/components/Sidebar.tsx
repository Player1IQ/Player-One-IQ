"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  Building2,
  CreditCard,
  FileText,
  Gamepad2,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Sparkles,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { OrganizationSwitcher } from "@/components/organization/OrganizationSwitcher";
import type { UserOrganization } from "@/lib/organization/queries";
import { useMemo } from "react";
import { navItemAccessible } from "@/lib/subscription/features";
import type { FeatureKey } from "@/lib/subscription/types";
import { navItems, type NavIconName } from "@/lib/navigation";
import { SidebarUser } from "@/components/SidebarUser";
import { UnreadBadge } from "@/components/messages/UnreadBadge";

const navIcons: Record<NavIconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  users: Users,
  building: Building2,
  "file-text": FileText,
  briefcase: Briefcase,
  "message-square": MessageSquare,
  sparkles: Sparkles,
  "user-cog": UserCog,
  "bar-chart": BarChart3,
  "credit-card": CreditCard,
  settings: Settings,
};

interface SidebarProps {
  enabledFeatures?: FeatureKey[];
  organizations?: UserOrganization[];
  activeOrganizationId?: string | null;
}

export function Sidebar({
  enabledFeatures,
  organizations = [],
  activeOrganizationId = null,
}: SidebarProps) {
  const pathname = usePathname();
  const items = useMemo(() => {
    if (!enabledFeatures) return navItems;
    const features = new Set(enabledFeatures);
    return navItems.filter((item) =>
      navItemAccessible(features, item.requiredFeature)
    );
  }, [enabledFeatures]);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-surface-raised">
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20 ring-1 ring-accent/40">
          <Gamepad2 className="h-5 w-5 text-accent-light" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-white">
            Player One IQ
          </p>
          <p className="text-xs text-gray-500">Creator Management</p>
        </div>
      </div>

      {activeOrganizationId ? (
        <OrganizationSwitcher
          organizations={organizations}
          activeOrganizationId={activeOrganizationId}
        />
      ) : null}

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {items.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = navIcons[item.icon];

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent/15 text-accent-light ring-1 ring-accent/30"
                  : "text-gray-400 hover:bg-surface-overlay hover:text-gray-200"
              }`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 ${
                  isActive
                    ? "text-accent-light"
                    : "text-gray-500 group-hover:text-gray-300"
                }`}
              />
              <span className="flex-1">{item.label}</span>
              {item.showUnreadBadge && <UnreadBadge />}
            </Link>
          );
        })}
      </nav>

      <SidebarUser />
    </aside>
  );
}
