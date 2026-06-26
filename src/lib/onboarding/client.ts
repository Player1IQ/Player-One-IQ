import type { OnboardingStepId } from "./types";

export const ONBOARDING_STEP_SESSION_KEY = "poiq_onboarding_step";

export function markOnboardingStartedClient() {
  if (typeof document === "undefined") return;
  document.cookie = "poiq_onboarding_started=1; path=/; max-age=3600; SameSite=Lax";
}

export function readOnboardingStepClient(): OnboardingStepId | null {
  if (typeof window === "undefined") return null;
  const stored = sessionStorage.getItem(ONBOARDING_STEP_SESSION_KEY);
  if (
    stored === "welcome" ||
    stored === "connect" ||
    stored === "finish"
  ) {
    return stored;
  }
  return null;
}

export function storeOnboardingStepClient(step: OnboardingStepId) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ONBOARDING_STEP_SESSION_KEY, step);
}

export function clearOnboardingStepClient() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ONBOARDING_STEP_SESSION_KEY);
}
