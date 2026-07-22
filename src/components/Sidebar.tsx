"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Sparkles,
  Target,
  UserCog,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { OrganizationSwitcher } from "@/components/organization/OrganizationSwitcher";
import type { UserOrganization } from "@/lib/organization/queries";
import { useMemo } from "react";
import type { FeatureKey } from "@/lib/subscription/types";
import { getAccessibleNavItems, type NavIconName } from "@/lib/navigation";
import type { TeamRole } from "@/lib/team";
import { SidebarUser } from "@/components/SidebarUser";
import { UnreadBadge } from "@/components/messages/UnreadBadge";
import { STAFF_DASHBOARD_PATH } from "@/lib/routes";
import { cn } from "@/lib/utils";

const navIcons: Record<NavIconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  users: Users,
  building: Building2,
  target: Target,
  "file-text": FileText,
  briefcase: Briefcase,
  "message-square": MessageSquare,
  sparkles: Sparkles,
  "user-cog": UserCog,
  "bar-chart": BarChart3,
  "credit-card": CreditCard,
  settings: Settings,
  calendar: Calendar,
};

interface SidebarProps {
  enabledFeatures?: FeatureKey[];
  organizations?: UserOrganization[];
  activeOrganizationId?: string | null;
  organizationName?: string;
  organizationLogoUrl?: string | null;
  teamRole?: TeamRole | null;
  onNavigate?: () => void;
}

export function Sidebar({
  enabledFeatures,
  organizations = [],
  activeOrganizationId = null,
  organizationName,
  organizationLogoUrl,
  teamRole = null,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const items = useMemo(() => {
    const features = new Set(enabledFeatures ?? []);
    return getAccessibleNavItems(features, teamRole);
  }, [enabledFeatures, teamRole]);
  const showBillingCta =
    teamRole !== "player" &&
    teamRole !== "content_creator" &&
    teamRole !== "sponsor";

  return (
    <aside className="flex h-full w-64 flex-col border-r border-white/[0.06] bg-surface-raised/95 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/[0.06] px-5">
        {organizationLogoUrl ? (
          <>
            <img
              src={organizationLogoUrl}
              alt={organizationName ? `${organizationName} logo` : "Organization logo"}
              className="h-9 w-9 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight text-white">
                {organizationName ?? "Workspace"}
              </p>
              <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500">
                Creator Platform
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-muted shadow-glow-active">
              <span className="text-sm font-black text-white">P1</span>
              <div className="absolute inset-0 rounded-xl bg-accent/20 blur-md" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-white">
                Player One IQ
              </p>
              <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500">
                Creator Platform
              </p>
            </div>
          </>
        )}
      </div>

      {activeOrganizationId ? (
        <OrganizationSwitcher
          organizations={organizations}
          activeOrganizationId={activeOrganizationId}
        />
      ) : null}

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" data-tour-sidebar>
        {items.map((item) => {
          const isActive =
            item.href === STAFF_DASHBOARD_PATH
              ? pathname === STAFF_DASHBOARD_PATH
              : item.href === "/portal"
                ? pathname === "/portal"
                : item.href === "/portal/profile"
                  ? pathname.startsWith("/creators/") ||
                    pathname === "/portal/profile"
                  : pathname.startsWith(item.href);
          const Icon = navIcons[item.icon];

          return (
            <Link
              key={item.href}
              href={item.href}
              data-tour-nav={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "nav-active-glow text-accent-light"
                  : "text-gray-400 hover:bg-white/[0.04] hover:text-gray-200"
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-colors",
                  isActive
                    ? "text-accent-light"
                    : "text-gray-500 group-hover:text-gray-300"
                )}
              />
              <span className="flex-1">{item.label}</span>
              {item.showUnreadBadge && <UnreadBadge />}
            </Link>
          );
        })}
      </nav>

      {showBillingCta ? (
        <div className="mx-3 mb-2">
          <Link
            href="/billing"
            onClick={onNavigate}
            className="group flex items-center gap-3 rounded-xl border border-accent/20 bg-gradient-to-r from-accent/10 to-accent/5 p-3 transition-all duration-200 hover:border-accent/40 hover:shadow-glow"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
              <Zap className="h-4 w-4 text-accent-light" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white">Upgrade Plan</p>
              <p className="text-[10px] text-gray-500">Unlock AI & analytics</p>
            </div>
          </Link>
        </div>
      ) : null}

      <SidebarUser />
    </aside>
  );
}
