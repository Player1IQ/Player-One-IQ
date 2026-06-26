import { DashboardLayout } from "@/components/DashboardLayout";
import { SubscriptionPageGate } from "@/components/subscription/SubscriptionPageGate";
import { PlanBillingSection } from "@/components/subscription/PlanBillingSection";
import { SponsorsPageClient } from "@/components/sponsors/SponsorsPageClient";
import { getSponsors } from "@/lib/sponsors/queries";
import { enrichSponsorsWithContractStats } from "@/lib/sponsors";
import { getContracts } from "@/lib/contracts/queries";
import { hasFullAccess, getCurrentUserRole } from "@/lib/permissions";

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
        <div className="space-y-6">
          <PlanBillingSection
            highlightMetrics={["creators", "team_members"]}
          />
          <SponsorsPageClient
            sponsors={enrichedSponsors}
            canWrite={hasFullAccess(role, "sponsors")}
          />
        </div>
      </SubscriptionPageGate>
    </DashboardLayout>
  );
}
