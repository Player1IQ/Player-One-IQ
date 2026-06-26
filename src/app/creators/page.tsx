import { DashboardLayout } from "@/components/DashboardLayout";
import { CreatorsPageClient } from "@/components/creators/CreatorsPageClient";
import { SubscriptionPageGate } from "@/components/subscription/SubscriptionPageGate";
import { PlanBillingSection } from "@/components/subscription/PlanBillingSection";
import { getCreators } from "@/lib/creators/queries";
import { hasFullAccess, getCurrentUserRole } from "@/lib/permissions";
import { isSeedEnabled } from "@/lib/seed/constants";

export default async function CreatorsPage() {
  const [creators, role] = await Promise.all([
    getCreators(),
    getCurrentUserRole(),
  ]);

  return (
    <DashboardLayout
      title="Creators"
      description="Manage your creator roster and partnerships"
    >
      <SubscriptionPageGate
        required="creator_profiles"
        featureLabel="Creator profiles"
      >
        <div className="space-y-6">
          <PlanBillingSection highlightMetrics={["creators"]} />
          <CreatorsPageClient
            creators={creators}
            canWrite={hasFullAccess(role, "creators")}
            showSeedButton={isSeedEnabled()}
          />
        </div>
      </SubscriptionPageGate>
    </DashboardLayout>
  );
}
