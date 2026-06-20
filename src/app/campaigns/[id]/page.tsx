import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CampaignDetail } from "@/components/campaigns/CampaignDetail";
import { SubscriptionPageGate } from "@/components/subscription/SubscriptionPageGate";
import { getCampaignCreators } from "@/lib/campaigns/creator-sync";
import { getCampaignById } from "@/lib/campaigns/queries";
import { getCreators } from "@/lib/creators/queries";
import { getSponsors } from "@/lib/sponsors/queries";
import { getOpportunities } from "@/lib/opportunities/queries";
import {
  canAccessCampaign,
  canWriteData,
  getCurrentUserRole,
} from "@/lib/permissions";

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({
  params,
}: CampaignDetailPageProps) {
  const { id } = await params;
  const [campaign, sponsors, opportunities, role, hasAccess] = await Promise.all([
    getCampaignById(id),
    getSponsors(),
    getOpportunities(),
    getCurrentUserRole(),
    canAccessCampaign(id),
  ]);

  if (!campaign || !hasAccess) {
    notFound();
  }

  const canWrite = canWriteData(role);
  const [assignments, creators] = await Promise.all([
    getCampaignCreators(id),
    canWrite ? getCreators() : Promise.resolve([]),
  ]);

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
          assignments={assignments}
          creators={creators}
          canWrite={canWrite}
          canManageCreators={canWrite}
        />
      </SubscriptionPageGate>
    </DashboardLayout>
  );
}
