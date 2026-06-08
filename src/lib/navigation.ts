import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  UserCog,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Creators", href: "/creators", icon: Users },
  { label: "Sponsors", href: "/sponsors", icon: Building2 },
  { label: "Contracts", href: "/contracts", icon: FileText },
  { label: "Team", href: "/team", icon: UserCog },
  { label: "Settings", href: "/settings", icon: Settings },
];
