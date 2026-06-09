import { DashboardLayout } from "@/components/DashboardLayout";
import { SponsorsPageClient } from "@/components/sponsors/SponsorsPageClient";
import { getSponsors } from "@/lib/sponsors/queries";
import { canWriteData, getCurrentUserRole } from "@/lib/permissions";

export default async function SponsorsPage() {
  const [sponsors, role] = await Promise.all([
    getSponsors(),
    getCurrentUserRole(),
  ]);

  return (
    <DashboardLayout
      title="Sponsors"
      description="Track sponsor relationships and brand partnerships"
    >
      <SponsorsPageClient
        sponsors={sponsors}
        canWrite={canWriteData(role)}
      />
    </DashboardLayout>
  );
}
