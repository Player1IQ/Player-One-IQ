import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CampaignDetail } from "@/components/campaigns/CampaignDetail";
import { SubscriptionPageGate } from "@/components/subscription/SubscriptionPageGate";
import { getCampaignById } from "@/lib/campaigns/queries";
import { getSponsors } from "@/lib/sponsors/queries";
import { getOpportunities } from "@/lib/opportunities/queries";
import { canWriteData, getCurrentUserRole } from "@/lib/permissions";

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({
  params,
}: CampaignDetailPageProps) {
  const { id } = await params;
  const [campaign, sponsors, opportunities, role] = await Promise.all([
    getCampaignById(id),
    getSponsors(),
    getOpportunities(),
    getCurrentUserRole(),
  ]);

  if (!campaign) {
    notFound();
  }

  return (
    <DashboardLayout title={campaign.name} description={campaign.sponsorName}>
      <SubscriptionPageGate
        required="campaign_tracking"
        featureLabel="Campaign tracking"
      >
        <CampaignDetail
          campaign={campaign}
          sponsors={sponsors}
          opportunities={opportunities}
          canWrite={canWriteData(role)}
        />
      </SubscriptionPageGate>
    </DashboardLayout>
  );
}
