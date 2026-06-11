import { DashboardLayout } from "@/components/DashboardLayout";
import { SubscriptionPageGate } from "@/components/subscription/SubscriptionPageGate";
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
      <SubscriptionPageGate required="sponsor_crm" featureLabel="Sponsor CRM">
        <SponsorsPageClient
          sponsors={sponsors}
          canWrite={canWriteData(role)}
        />
      </SubscriptionPageGate>
    </DashboardLayout>
  );
}
