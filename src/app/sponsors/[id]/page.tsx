import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SponsorDetail } from "@/components/sponsors/SponsorDetail";
import { getSponsorById } from "@/lib/sponsors/queries";
import { getContracts } from "@/lib/contracts/queries";
import { getCampaignsBySponsor } from "@/lib/campaigns/queries";
import {
  canAccessSponsor,
  hasFullAccess,
  getCurrentUserMembership,
  getCurrentUserRole,
} from "@/lib/permissions";
import { isPortalRole } from "@/lib/team";
import { getSubscriptionContext } from "@/lib/subscription/queries";
import { hasFeature } from "@/lib/subscription/features";

interface SponsorDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SponsorDetailPage({
  params,
}: SponsorDetailPageProps) {
  const { id } = await params;
  const membership = await getCurrentUserMembership();
  const isPortalUser = Boolean(membership && isPortalRole(membership.role));

  const [sponsor, role, contracts, subscription] = await Promise.all([
    getSponsorById(id),
    getCurrentUserRole(),
    getContracts(),
    getSubscriptionContext(),
  ]);

  if (!sponsor) {
    notFound();
  }

  if (!(await canAccessSponsor(id))) {
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
        isPortalUser={isPortalUser}
      />
    </DashboardLayout>
  );
}
