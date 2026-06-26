import { DashboardLayout } from "@/components/DashboardLayout";
import { CreatorsPageClient } from "@/components/creators/CreatorsPageClient";
import { SubscriptionPageGate } from "@/components/subscription/SubscriptionPageGate";
import { PlanBillingSummary } from "@/components/subscription/PlanBillingSummary";
import { getCreators } from "@/lib/creators/queries";
import {
  canViewBilling,
  hasFullAccess,
  getCurrentUserRole,
} from "@/lib/permissions";
import { getSubscriptionContext } from "@/lib/subscription/queries";
import { isSeedEnabled } from "@/lib/seed/constants";

export default async function CreatorsPage() {
  const [creators, role, subscriptionContext] = await Promise.all([
    getCreators(),
    getCurrentUserRole(),
    getSubscriptionContext(),
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
          {canViewBilling(role) ? (
            <PlanBillingSummary
              subscription={subscriptionContext.subscription}
              usage={subscriptionContext.usage}
              canViewBilling
            />
          ) : null}
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
