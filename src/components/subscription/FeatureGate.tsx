import type { FeatureKey } from "@/lib/subscription/types";
import { hasAnyFeature, hasFeature } from "@/lib/subscription/features";
import { UpgradePrompt } from "./UpgradePrompt";

interface FeatureGateProps {
  features: Set<FeatureKey>;
  required: FeatureKey | FeatureKey[];
  featureLabel?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({
  features,
  required,
  featureLabel,
  children,
  fallback,
}: FeatureGateProps) {
  const allowed = Array.isArray(required)
    ? hasAnyFeature(features, required)
    : hasFeature(features, required);

  if (allowed) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <UpgradePrompt
      featureLabel={featureLabel}
      message="This feature is not included in your current subscription plan."
    />
  );
}
