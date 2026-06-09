"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2 } from "lucide-react";
import { navItems } from "@/lib/navigation";
import { SidebarUser } from "@/components/SidebarUser";
import { UnreadBadge } from "@/components/messages/UnreadBadge";

export function Sidebar() {
  const pathname = usePathname();

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

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

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
