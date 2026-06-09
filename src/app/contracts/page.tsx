import { DashboardLayout } from "@/components/DashboardLayout";
import { ContractsPageClient } from "@/components/contracts/ContractsPageClient";
import { getContracts } from "@/lib/contracts/queries";
import { getCreators } from "@/lib/creators/queries";
import { getSponsors } from "@/lib/sponsors/queries";

export default async function ContractsPage() {
  const [contracts, creators, sponsors] = await Promise.all([
    getContracts(),
    getCreators(),
    getSponsors(),
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
      />
    </DashboardLayout>
  );
}
