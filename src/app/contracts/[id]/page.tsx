import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ContractDetail } from "@/components/contracts/ContractDetail";
import { getContractById } from "@/lib/contracts/queries";
import { getCreators } from "@/lib/creators/queries";
import { getSponsors } from "@/lib/sponsors/queries";
import { canWriteData, getCurrentUserRole } from "@/lib/permissions";

interface ContractDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContractDetailPage({
  params,
}: ContractDetailPageProps) {
  const { id } = await params;
  const [contract, creators, sponsors, role] = await Promise.all([
    getContractById(id),
    getCreators(),
    getSponsors(),
    getCurrentUserRole(),
  ]);

  if (!contract) {
    notFound();
  }

  return (
    <DashboardLayout
      title={contract.contractName}
      description={`${contract.creatorName} × ${contract.sponsorName}`}
    >
      <ContractDetail
        contract={contract}
        creators={creators}
        sponsors={sponsors}
        canWrite={canWriteData(role)}
      />
    </DashboardLayout>
  );
}
