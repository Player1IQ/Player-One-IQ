import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SponsorDetail } from "@/components/sponsors/SponsorDetail";
import { getSponsorById } from "@/lib/sponsors/queries";
import { getContracts } from "@/lib/contracts/queries";
import { canWriteData, getCurrentUserRole } from "@/lib/permissions";

interface SponsorDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SponsorDetailPage({
  params,
}: SponsorDetailPageProps) {
  const { id } = await params;
  const [sponsor, role, contracts] = await Promise.all([
    getSponsorById(id),
    getCurrentUserRole(),
    getContracts(),
  ]);

  if (!sponsor) {
    notFound();
  }

  return (
    <DashboardLayout
      title={sponsor.companyName}
      description={sponsor.industry}
    >
      <SponsorDetail
        sponsor={sponsor}
        contracts={contracts.filter((c) => c.sponsorId === id)}
        canWrite={canWriteData(role)}
      />
    </DashboardLayout>
  );
}
