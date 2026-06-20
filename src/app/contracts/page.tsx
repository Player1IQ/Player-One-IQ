import { DashboardLayout } from "@/components/DashboardLayout";
import { SubscriptionPageGate } from "@/components/subscription/SubscriptionPageGate";
import { ContractsPageClient } from "@/components/contracts/ContractsPageClient";
import { getContracts } from "@/lib/contracts/queries";
import { getDeliverablesSummariesForContracts } from "@/lib/contract-deliverables/queries";
import { getCreators } from "@/lib/creators/queries";
import { getSponsors } from "@/lib/sponsors/queries";
import {
  canWriteData,
  getCurrentUserMembership,
  getCurrentUserRole,
} from "@/lib/permissions";
import { isPortalRole } from "@/lib/team";

interface ContractsPageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function ContractsPage({ searchParams }: ContractsPageProps) {
  const { filter } = await searchParams;
  const initialSummaryFilter =
    filter === "expiring" || filter === "overdue" || filter === "active" || filter === "pipeline"
      ? filter
      : null;

  const membership = await getCurrentUserMembership();
  const isPortalUser = Boolean(membership && isPortalRole(membership.role));

  const [contracts, creators, sponsors, role] = await Promise.all([
    getContracts(),
    isPortalUser ? Promise.resolve([]) : getCreators(),
    isPortalUser ? Promise.resolve([]) : getSponsors(),
    getCurrentUserRole(),
  ]);

  const deliverableSummaries = await getDeliverablesSummariesForContracts(
    contracts.map((c) => c.id)
  );

  return (
    <DashboardLayout
      title={isPortalUser ? "Your deals" : "Contracts"}
      description={
        isPortalUser
          ? "Sponsorship agreements linked to your profile"
          : "Manage sponsorship agreements and deliverables"
      }
    >
      <SubscriptionPageGate required="contracts" featureLabel="Contracts">
        <ContractsPageClient
          contracts={contracts}
          creators={creators}
          sponsors={sponsors}
          deliverableSummaries={deliverableSummaries}
          canWrite={canWriteData(role)}
          initialSummaryFilter={initialSummaryFilter}
          isPortalUser={isPortalUser}
        />
      </SubscriptionPageGate>
    </DashboardLayout>
  );
}
