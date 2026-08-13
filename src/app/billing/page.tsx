import { STAFF_DASHBOARD_PATH } from "@/lib/routes";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { BillingPageClient } from "@/components/billing/BillingPageClient";
import { getBillingOverview } from "@/lib/billing/queries";
import {
  canManageBilling,
  canViewBilling,
  getCurrentUserMembership,
  getCurrentUserRole,
} from "@/lib/permissions";

export default async function BillingPage() {
  const [billing, membership, role] = await Promise.all([
    getBillingOverview(),
    getCurrentUserMembership(),
    getCurrentUserRole(),
  ]);

  const isWorkspaceFounder = membership?.isWorkspaceFounder ?? false;

  if (!canViewBilling(role, isWorkspaceFounder)) {
    redirect(STAFF_DASHBOARD_PATH);
  }

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
          canManage={canManageBilling(role, isWorkspaceFounder)}
          features={billing.features}
        />
      </Suspense>
    </DashboardLayout>
  );
}
