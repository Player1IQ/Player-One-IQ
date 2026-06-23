import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SponsorDetail } from "@/components/sponsors/SponsorDetail";
import { getSponsorById } from "@/lib/sponsors/queries";
import { getContracts } from "@/lib/contracts/queries";
import { getCampaignsBySponsor } from "@/lib/campaigns/queries";
import { hasFullAccess, getCurrentUserRole } from "@/lib/permissions";
import { getSubscriptionContext } from "@/lib/subscription/queries";
import { hasFeature } from "@/lib/subscription/features";

interface SponsorDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SponsorDetailPage({
  params,
}: SponsorDetailPageProps) {
  const { id } = await params;
  const [sponsor, role, contracts, subscription] = await Promise.all([
    getSponsorById(id),
    getCurrentUserRole(),
    getContracts(),
    getSubscriptionContext(),
  ]);

  if (!sponsor) {
    notFound();
  }

  const canViewCampaigns = hasFeature(
    subscription.features,
    "campaign_tracking"
  );
  const campaigns = canViewCampaigns
    ? await getCampaignsBySponsor(id)
    : [];

  return (
    <DashboardLayout
      title={sponsor.companyName}
      description={sponsor.industry}
    >
      <SponsorDetail
        sponsor={sponsor}
        contracts={contracts.filter((c) => c.sponsorId === id)}
        campaigns={campaigns}
        canWrite={hasFullAccess(role, "sponsors")}
        canViewCampaigns={canViewCampaigns}
      />
    </DashboardLayout>
  );
}
