import { DashboardLayout } from "@/components/DashboardLayout";
import { ContractsPageClient } from "@/components/contracts/ContractsPageClient";
import { getContracts } from "@/lib/contracts/queries";
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

  return (
    <DashboardLayout
      title="Contracts"
      description="Manage sponsorship agreements and deliverables"
    >
      <ContractsPageClient
        contracts={contracts}
        creators={creators}
        sponsors={sponsors}
        canWrite={canWriteData(role)}
        initialSummaryFilter={initialSummaryFilter}
      />
    </DashboardLayout>
  );
}
