import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ContractDetail } from "@/components/contracts/ContractDetail";
import { getContractById } from "@/lib/contracts";

interface ContractDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContractDetailPage({
  params,
}: ContractDetailPageProps) {
  const { id } = await params;
  const contract = getContractById(id);

  if (!contract) {
    notFound();
  }

  return (
    <DashboardLayout
      title={contract.name}
      description={`${contract.creator} × ${contract.sponsor}`}
    >
      <ContractDetail contract={contract} />
    </DashboardLayout>
  );
}
