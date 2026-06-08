import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SponsorDetail } from "@/components/sponsors/SponsorDetail";
import { getSponsorById } from "@/lib/sponsors";

interface SponsorDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SponsorDetailPage({
  params,
}: SponsorDetailPageProps) {
  const { id } = await params;
  const sponsor = getSponsorById(id);

  if (!sponsor) {
    notFound();
  }

  return (
    <DashboardLayout
      title={sponsor.companyName}
      description={sponsor.industry}
    >
      <SponsorDetail sponsor={sponsor} />
    </DashboardLayout>
  );
}
