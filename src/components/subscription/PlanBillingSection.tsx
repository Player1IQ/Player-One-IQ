import { canViewBilling, getCurrentUserRole } from "@/lib/permissions";
import { getSubscriptionContext } from "@/lib/subscription/queries";
import type { UsageMetricKey } from "@/lib/subscription/types";
import { PlanBillingSummary } from "./PlanBillingSummary";

interface PlanBillingSectionProps {
  highlightMetrics?: UsageMetricKey[];
}

export async function PlanBillingSection({
  highlightMetrics,
}: PlanBillingSectionProps) {
  const role = await getCurrentUserRole();
  if (!canViewBilling(role)) return null;

  const context = await getSubscriptionContext();

  return (
    <PlanBillingSummary
      subscription={context.subscription}
      usage={context.usage}
      highlightMetrics={highlightMetrics}
    />
  );
}
