import { DashboardLayout } from "@/components/DashboardLayout";
import { SubscriptionPageGate } from "@/components/subscription/SubscriptionPageGate";
import { SponsorsPageClient } from "@/components/sponsors/SponsorsPageClient";
import { getSponsors } from "@/lib/sponsors/queries";
import { enrichSponsorsWithContractStats } from "@/lib/sponsors";
import { getContracts } from "@/lib/contracts/queries";
import { canWriteData, getCurrentUserRole } from "@/lib/permissions";

export default async function SponsorsPage() {
  const [sponsors, contracts, role] = await Promise.all([
    getSponsors(),
    getContracts(),
    getCurrentUserRole(),
  ]);

  const enrichedSponsors = enrichSponsorsWithContractStats(sponsors, contracts);

  return (
    <DashboardLayout
      title="Sponsors"
      description="Track sponsor relationships and brand partnerships"
    >
      <SubscriptionPageGate required="sponsor_crm" featureLabel="Sponsor CRM">
        <SponsorsPageClient
          sponsors={enrichedSponsors}
          canWrite={canWriteData(role)}
        />
      </SubscriptionPageGate>
    </DashboardLayout>
  );
}
