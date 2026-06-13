import { DashboardLayout } from "@/components/DashboardLayout";
import { SubscriptionPageGate } from "@/components/subscription/SubscriptionPageGate";
import { ContractsPageClient } from "@/components/contracts/ContractsPageClient";
import { getContracts } from "@/lib/contracts/queries";
import { getDeliverablesSummariesForContracts } from "@/lib/contract-deliverables/queries";
import { getCreators } from "@/lib/creators/queries";
import { getSponsors } from "@/lib/sponsors/queries";
import { canWriteData, getCurrentUserRole } from "@/lib/permissions";

interface ContractsPageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function ContractsPage({ searchParams }: ContractsPageProps) {
  const { filter } = await searchParams;
  const initialSummaryFilter =
    filter === "expiring" || filter === "overdue" || filter === "active" || filter === "pipeline"
      ? filter
      : null;
  const [contracts, creators, sponsors, role] = await Promise.all([
    getContracts(),
    getCreators(),
    getSponsors(),
    getCurrentUserRole(),
  ]);

  const deliverableSummaries = await getDeliverablesSummariesForContracts(
    contracts.map((c) => c.id)
  );

  return (
    <DashboardLayout
      title="Contracts"
      description="Manage sponsorship agreements and deliverables"
    >
      <SubscriptionPageGate required="contracts" featureLabel="Contracts">
        <ContractsPageClient
          contracts={contracts}
          creators={creators}
          sponsors={sponsors}
          deliverableSummaries={deliverableSummaries}
          canWrite={canWriteData(role)}
          initialSummaryFilter={initialSummaryFilter}
        />
      </SubscriptionPageGate>
    </DashboardLayout>
  );
}
