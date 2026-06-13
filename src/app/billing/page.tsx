import { Suspense } from "react";
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
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        }
      >
        <BillingPageClient
          subscription={billing.subscription}
          usage={billing.usage}
          aiUsage={billing.aiUsage}
          tierPlans={billing.tierPlans}
          canManage={canManageBilling(role)}
          features={billing.features}
        />
      </Suspense>
    </DashboardLayout>
  );
}
