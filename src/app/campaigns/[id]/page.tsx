import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CampaignDetail } from "@/components/campaigns/CampaignDetail";
import { SubscriptionPageGate } from "@/components/subscription/SubscriptionPageGate";
import { getContractsForCampaign } from "@/lib/campaigns/contract-links";
import { getCampaignCreators } from "@/lib/campaigns/creator-sync";
import { getCampaignById } from "@/lib/campaigns/queries";
import { getCreators } from "@/lib/creators/queries";
import { getSponsors } from "@/lib/sponsors/queries";
import { getOpportunities } from "@/lib/opportunities/queries";
import {
  canAccessCampaign,
  hasFullAccess,
  getCurrentUserMembership,
} from "@/lib/permissions";
import { isPortalRole } from "@/lib/team";

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({
  params,
}: CampaignDetailPageProps) {
  const { id } = await params;
  const membership = await getCurrentUserMembership();
  const role = membership?.role ?? null;
  const isPortalUser = isPortalRole(role);

  const [campaign, sponsors, opportunities, hasAccess] = await Promise.all([
    getCampaignById(id),
    isPortalUser ? Promise.resolve([]) : getSponsors(),
    isPortalUser ? Promise.resolve([]) : getOpportunities(),
    canAccessCampaign(id),
  ]);

  if (!campaign || !hasAccess) {
    notFound();
  }

  const canWrite = hasFullAccess(role, "campaigns") && !isPortalUser;
  const [assignments, creators, relatedContracts] = await Promise.all([
    getCampaignCreators(id),
    canWrite ? getCreators() : Promise.resolve([]),
    getContractsForCampaign(id),
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
          relatedContracts={relatedContracts}
          canWrite={canWrite}
          canManageCreators={canWrite}
          isPortalUser={isPortalUser}
        />
      </SubscriptionPageGate>
    </DashboardLayout>
  );
}
