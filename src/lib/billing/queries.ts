import {
  getAiUsageSummary,
  getOrganizationSubscription,
  getSubscriptionContext,
  getSubscriptionPlans,
  getUsageSnapshots,
} from "@/lib/subscription/queries";
import { upgradePaths } from "@/lib/subscription/plans";
import type { PlanCode } from "@/lib/subscription/types";

export async function getBillingOverview() {
  const [context, allPlans, aiUsage] = await Promise.all([
    getSubscriptionContext(),
    getSubscriptionPlans(),
    getAiUsageSummary(),
  ]);

  const currentPlanCode = context.subscription?.plan.code;
  const availableUpgrades = currentPlanCode
    ? upgradePaths[currentPlanCode as PlanCode] ?? []
    : [];

  const upgradePlans = allPlans.filter((plan) =>
    availableUpgrades.includes(plan.code)
  );

  const tierPlans = context.subscription
    ? allPlans.filter(
        (p) => p.tierGroup === context.subscription!.plan.tierGroup
      )
    : allPlans;

  return {
    subscription: context.subscription,
    features: Array.from(context.features),
    usage: context.usage,
    aiUsage,
    tierPlans,
    upgradePlans,
    allPlans,
  };
}

export async function getBillingSummary() {
  const subscription = await getOrganizationSubscription();
  const usage = subscription
    ? await getUsageSnapshots(subscription.plan.limits)
    : [];

  return { subscription, usage };
}
