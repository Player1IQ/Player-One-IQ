import { Sidebar } from "./Sidebar";
import { SupabaseConfigBanner } from "@/components/auth/SupabaseConfigBanner";
import { MessageNotifications } from "@/components/messages/MessageNotifications";
import { PendingInviteBannerWrapper } from "@/components/team/PendingInviteBannerWrapper";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { getSearchIndex } from "@/lib/search/queries";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  headerActions?: React.ReactNode;
}

export async function DashboardLayout({
  children,
  title,
  description,
  headerActions,
}: DashboardLayoutProps) {
  const searchIndex = await getSearchIndex();

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <div className="pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-surface/80 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between px-8">
            <div>
              <h1 className="text-lg font-semibold text-white">{title}</h1>
              {description && (
                <p className="text-sm text-gray-500">{description}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <GlobalSearch items={searchIndex} />
              {headerActions}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent-light ring-1 ring-accent/20">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-light" />
                Live
              </span>
            </div>
          </div>
        </header>
        <main className="p-8">
          <SupabaseConfigBanner />
          <PendingInviteBannerWrapper />
          {children}
        </main>
        <MessageNotifications />
      </div>
    </div>
  );
}
