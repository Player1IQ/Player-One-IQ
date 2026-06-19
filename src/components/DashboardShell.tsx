"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { MessageNotificationBell } from "@/components/messages/MessageNotificationBell";
import { PresenceHeartbeat } from "@/components/presence/PresenceHeartbeat";
import { Sidebar } from "./Sidebar";
import type { FeatureKey } from "@/lib/subscription/types";
import type { UserOrganization } from "@/lib/organization/queries";

interface DashboardShellProps {
  children: React.ReactNode;
  header: React.ReactNode;
  mobileTitle?: string;
  mobileHeaderActions?: React.ReactNode;
  enabledFeatures?: FeatureKey[];
  messagingEnabled?: boolean;
  organizations?: UserOrganization[];
  activeOrganizationId?: string | null;
  organizationName?: string;
  organizationLogoUrl?: string | null;
}

export function DashboardShell({
  children,
  header,
  mobileTitle = "Player One IQ",
  mobileHeaderActions,
  enabledFeatures,
  messagingEnabled = true,
  organizations,
  activeOrganizationId,
  organizationName,
  organizationLogoUrl,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface">
      <PresenceHeartbeat />
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — drawer on mobile, fixed on desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          enabledFeatures={enabledFeatures}
          organizations={organizations}
          activeOrganizationId={activeOrganizationId}
          organizationName={organizationName}
          organizationLogoUrl={organizationLogoUrl}
          onNavigate={() => setMobileOpen(false)}
        />
      </div>

      <div className="lg:pl-64">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/[0.06] bg-surface/90 px-4 backdrop-blur-xl lg:hidden">
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
          <span className="min-w-0 truncate text-sm font-semibold text-white">
            {mobileTitle}
          </span>
          <div className="ml-auto flex items-center gap-1">
            {mobileHeaderActions}
            <MessageNotificationBell
              messagingEnabled={messagingEnabled}
            />
          </div>
        </div>

        {header}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
