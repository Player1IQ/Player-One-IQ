import { DashboardLayout } from "@/components/DashboardLayout";
import { SubscriptionPageGate } from "@/components/subscription/SubscriptionPageGate";
import { CampaignsPageClient } from "@/components/campaigns/CampaignsPageClient";
import { getCampaigns } from "@/lib/campaigns/queries";
import { getSponsors } from "@/lib/sponsors/queries";
import { getOpportunities } from "@/lib/opportunities/queries";
import { canWriteData, getCurrentUserRole } from "@/lib/permissions";

export default async function CampaignsPage() {
  const [campaigns, sponsors, opportunities, role] = await Promise.all([
    getCampaigns(),
    getSponsors(),
    getOpportunities(),
    getCurrentUserRole(),
  ]);

  return (
    <DashboardLayout
      title="Campaigns"
      description="Track sponsor campaign budgets, status, and linked opportunities"
    >
      <SubscriptionPageGate
        required="campaign_tracking"
        featureLabel="Campaign tracking"
      >
        <CampaignsPageClient
          campaigns={campaigns}
          sponsors={sponsors}
          opportunities={opportunities}
          canWrite={canWriteData(role)}
        />
      </SubscriptionPageGate>
    </DashboardLayout>
  );
}
