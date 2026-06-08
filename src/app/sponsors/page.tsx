import { DashboardLayout } from "@/components/DashboardLayout";
import { SponsorsPageClient } from "@/components/sponsors/SponsorsPageClient";
import { getSponsors } from "@/lib/sponsors/queries";

export default async function SponsorsPage() {
  const sponsors = await getSponsors();

  return (
    <DashboardLayout
      title="Sponsors"
      description="Track sponsor relationships and brand partnerships"
    >
      <SponsorsPageClient sponsors={sponsors} />
    </DashboardLayout>
  );
}
