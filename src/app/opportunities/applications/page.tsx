import { DashboardLayout } from "@/components/DashboardLayout";
import { ApplicationsPageClient } from "@/components/opportunities/ApplicationsPageClient";
import { getAllApplications } from "@/lib/opportunities/queries";

export default async function ApplicationsPage() {
  const applications = await getAllApplications();

  return (
    <DashboardLayout
      title="Applications"
      description="Track creator applications across all opportunities"
    >
      <ApplicationsPageClient applications={applications} />
    </DashboardLayout>
  );
}
