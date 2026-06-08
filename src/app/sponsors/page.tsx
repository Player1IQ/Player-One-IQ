import { DashboardLayout } from "@/components/DashboardLayout";
import { SponsorsPageClient } from "@/components/sponsors/SponsorsPageClient";
import { sponsors } from "@/lib/sponsors";

export default function SponsorsPage() {
  return (
    <DashboardLayout
      title="Sponsors"
      description="Track sponsor relationships and brand partnerships"
    >
      <SponsorsPageClient sponsors={sponsors} />
    </DashboardLayout>
  );
}
