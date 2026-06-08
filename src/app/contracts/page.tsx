import { DashboardLayout } from "@/components/DashboardLayout";
import { ContractsPageClient } from "@/components/contracts/ContractsPageClient";
import { contracts } from "@/lib/contracts";

export default function ContractsPage() {
  return (
    <DashboardLayout
      title="Contracts"
      description="Manage sponsorship agreements and deliverables"
    >
      <ContractsPageClient contracts={contracts} />
    </DashboardLayout>
  );
}
