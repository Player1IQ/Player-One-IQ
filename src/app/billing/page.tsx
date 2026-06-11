import { DashboardLayout } from "@/components/DashboardLayout";
import { BillingPageClient } from "@/components/billing/BillingPageClient";
import { getBillingOverview } from "@/lib/billing/queries";
import { canManageBilling, getCurrentUserRole } from "@/lib/permissions";

export default async function BillingPage() {
  const [billing, role] = await Promise.all([
    getBillingOverview(),
    getCurrentUserRole(),
  ]);

  return (
    <DashboardLayout
      title="Billing"
      description="Manage your subscription, usage, and plan"
    >
      <BillingPageClient
        subscription={billing.subscription}
        usage={billing.usage}
        aiUsage={billing.aiUsage}
        tierPlans={billing.tierPlans}
        canManage={canManageBilling(role)}
        features={billing.features}
      />
    </DashboardLayout>
  );
}
