import { getSubscriptionContext } from "@/lib/subscription/queries";
import { hasAnyFeature, hasFeature } from "@/lib/subscription/features";
import type { FeatureKey } from "@/lib/subscription/types";
import { UpgradePrompt } from "./UpgradePrompt";

interface SubscriptionPageGateProps {
  required: FeatureKey | FeatureKey[];
  featureLabel?: string;
  children: React.ReactNode;
}

export async function SubscriptionPageGate({
  required,
  featureLabel,
  children,
}: SubscriptionPageGateProps) {
  const context = await getSubscriptionContext();
  const allowed = Array.isArray(required)
    ? hasAnyFeature(context.features, required)
    : hasFeature(context.features, required);

  if (!allowed) {
    return (
      <UpgradePrompt
        featureLabel={featureLabel}
        message="This section is not included in your current subscription plan. Upgrade to unlock it."
      />
    );
  }

  return <>{children}</>;
}
