"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Shield } from "lucide-react";

const tabs = [
  { label: "Team Members", href: "/team", icon: Users },
  { label: "Permissions", href: "/team/permissions", icon: Shield },
];

export function TeamNav() {
  const pathname = usePathname();

  return (
    <div className="mb-8 flex gap-1 rounded-lg border border-border bg-surface-raised p-1">
      {tabs.map((tab) => {
        const isActive =
          tab.href === "/team"
            ? pathname === "/team" || pathname.startsWith("/team/tm-")
            : pathname === tab.href;
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-accent/15 text-accent-light shadow-sm ring-1 ring-accent/30"
                : "text-gray-400 hover:bg-surface-overlay hover:text-gray-200"
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
