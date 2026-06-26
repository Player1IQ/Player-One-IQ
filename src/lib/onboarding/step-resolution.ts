import type { OnboardingFlow, OnboardingStepId } from "./types";

export function resolveStepIndex(
  flow: OnboardingFlow,
  step: string | null | undefined
): number {
  if (!step) return 0;
  const index = flow.steps.indexOf(step as OnboardingStepId);
  return index >= 0 ? index : 0;
}

/** URL and OAuth params beat session storage; server initial step is last resort. */
export function resolveOnboardingStepId(
  flow: OnboardingFlow,
  options: {
    stepFromUrl: string | null;
    oauthSuccess?: string | null;
    oauthError?: string | null;
    storedStep?: OnboardingStepId | null;
    serverInitialStep?: OnboardingStepId | null;
  }
): OnboardingStepId {
  const stepFromUrl = options.stepFromUrl;
  if (
    stepFromUrl &&
    flow.steps.includes(stepFromUrl as OnboardingStepId)
  ) {
    return stepFromUrl as OnboardingStepId;
  }

  const oauthResult = options.oauthSuccess ?? options.oauthError;
  if (oauthResult && flow.steps.includes("connect")) {
    return "connect";
  }

  if (
    options.storedStep &&
    flow.steps.includes(options.storedStep)
  ) {
    return options.storedStep;
  }

  if (
    options.serverInitialStep &&
    flow.steps.includes(options.serverInitialStep)
  ) {
    return options.serverInitialStep;
  }

  return "welcome";
}
