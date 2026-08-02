import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CreatorCoachPanel } from "@/components/creator-coach";
import { requireCreatorPortalUser } from "@/lib/portal/guard";
import { loadPortalCoachPageData } from "@/lib/portal/coach-page-data";

export default async function PortalCoachPage() {
  const { linkedCreatorId } = await requireCreatorPortalUser();
  const data = await loadPortalCoachPageData(linkedCreatorId);

  if (!data) {
    redirect("/portal");
  }

  return (
    <DashboardLayout
      title="Creator Coach"
      description="Personalized recommendations for your creator business"
    >
      {data.coachSnapshot ? (
        <CreatorCoachPanel
          snapshot={data.coachSnapshot}
          coachContext={data.coachContext}
          coachProfile={data.coachProfile}
          creatorId={data.creatorId}
          showSectionHeader={false}
        />
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-surface-raised/50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-gray-300">
            Creator Coach is temporarily unavailable
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Refresh the page or try again in a moment.
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}
