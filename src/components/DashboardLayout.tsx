import { DashboardShell } from "./DashboardShell";
import { SupabaseConfigBanner } from "@/components/auth/SupabaseConfigBanner";
import { MessageNotificationBell } from "@/components/messages/MessageNotificationBell";
import { MessageNotifications } from "@/components/messages/MessageNotifications";
import { PendingInviteBannerWrapper } from "@/components/team/PendingInviteBannerWrapper";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import {
  getOrganizationForUser,
  getUserOrganizations,
} from "@/lib/organization/queries";
import { getSearchIndex } from "@/lib/search/queries";
import { getSubscriptionContext } from "@/lib/subscription/queries";
import { getCurrentUserRole } from "@/lib/permissions";
import { enforcePortalRouteAccess } from "@/lib/portal/guard";
import { canAccessStaffDashboard } from "@/lib/team";
import { hasAnyFeature } from "@/lib/subscription/features";
import { ExportReportMenu } from "@/components/reports/ExportReportMenu";
import { Calendar } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  headerActions?: React.ReactNode;
}

function formatWelcomeDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export async function DashboardLayout({
  children,
  title,
  description,
  headerActions,
}: DashboardLayoutProps) {
  await enforcePortalRouteAccess();

  const currentUserRole = await getCurrentUserRole();
  const isPortalUser = !canAccessStaffDashboard(currentUserRole);

  const [searchIndex, subscriptionContext, organizations, activeOrganization] =
    await Promise.all([
      isPortalUser ? Promise.resolve([]) : getSearchIndex(),
      getSubscriptionContext(),
      getUserOrganizations(),
      getOrganizationForUser(),
    ]);

  const messagingEnabled = subscriptionContext.features.has("messaging");
  const canExportReports =
    !isPortalUser &&
    hasAnyFeature(subscriptionContext.features, [
      "advanced_analytics",
      "monthly_reports",
    ]);

  const header = (
    <header className="sticky top-0 z-20 hidden border-b border-white/[0.06] bg-surface/80 backdrop-blur-xl lg:block">
      <div className="flex h-16 items-center justify-between px-8">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <MessageNotificationBell messagingEnabled={messagingEnabled} />
          {!isPortalUser ? <GlobalSearch items={searchIndex} /> : null}
          {headerActions}
          {!isPortalUser ? (
            <div className="hidden items-center gap-2 rounded-xl border border-white/[0.06] bg-surface-raised/60 px-3 py-1.5 text-xs text-gray-400 xl:flex">
              <Calendar className="h-3.5 w-3.5" />
              {formatWelcomeDate()}
            </div>
          ) : null}
          {!isPortalUser ? (
            <ExportReportMenu canExport={canExportReports} variant="header" />
          ) : null}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Live
          </span>
        </div>
      </div>
    </header>
  );

  return (
    <>
      <DashboardShell
        enabledFeatures={Array.from(subscriptionContext.features)}
        messagingEnabled={messagingEnabled}
        organizations={organizations}
        activeOrganizationId={activeOrganization?.id ?? null}
        organizationName={activeOrganization?.name}
        organizationLogoUrl={activeOrganization?.logo_url ?? null}
        teamRole={currentUserRole}
        mobileTitle={title}
        mobileHeaderActions={
          !isPortalUser ? (
            <ExportReportMenu canExport={canExportReports} variant="mobile" />
          ) : undefined
        }
        header={header}
      >
        <SupabaseConfigBanner />
        <PendingInviteBannerWrapper />
        {children}
      </DashboardShell>
      <MessageNotifications />
    </>
  );
}
