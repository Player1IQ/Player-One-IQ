export const ONBOARDING_VERSION = 1;
export const ONBOARDING_STARTED_COOKIE = "poiq_onboarding_started";

/** Treat brand-new workspaces as needing onboarding even if auth metadata lags. */
export const RECENT_ORG_ONBOARDING_WINDOW_MS = 72 * 60 * 60 * 1000;

export interface OnboardingUserMetadata {
  onboarding_pending?: boolean;
  onboarding_completed_at?: string;
  onboarding_version?: number;
  portal_tour_pending?: boolean;
  portal_tour_completed_at?: string;
}

export function getOnboardingMetadata(
  metadata: Record<string, unknown> | null | undefined
): OnboardingUserMetadata {
  if (!metadata) return {};
  return {
    onboarding_pending:
      metadata.onboarding_pending === true ||
      metadata.onboarding_pending === "true",
    onboarding_completed_at:
      typeof metadata.onboarding_completed_at === "string"
        ? metadata.onboarding_completed_at
        : undefined,
    onboarding_version:
      typeof metadata.onboarding_version === "number"
        ? metadata.onboarding_version
        : undefined,
  };
}

export function shouldShowOnboarding(
  metadata: Record<string, unknown> | null | undefined,
  options?: { startedCookie?: boolean; recentWorkspace?: boolean }
): boolean {
  if (options?.startedCookie) return true;

  const onboarding = getOnboardingMetadata(metadata);
  if (onboarding.onboarding_pending === true) return true;
  if (onboarding.onboarding_completed_at) return false;
  if (options?.recentWorkspace) return true;

  return false;
}

export function onboardingPendingMetadata(): Record<string, unknown> {
  return {
    onboarding_pending: true,
    onboarding_completed_at: null,
    onboarding_version: ONBOARDING_VERSION,
  };
}

export function onboardingCompletedMetadata(): Record<string, unknown> {
  return {
    onboarding_pending: false,
    onboarding_completed_at: new Date().toISOString(),
    onboarding_version: ONBOARDING_VERSION,
    portal_tour_pending: true,
  };
}

export function portalTourCompletedMetadata(): Record<string, unknown> {
  return {
    portal_tour_pending: false,
    portal_tour_completed_at: new Date().toISOString(),
  };
}

export function portalTourPendingMetadata(): Record<string, unknown> {
  return {
    portal_tour_pending: true,
  };
}

export function isPortalTourPending(
  metadata: Record<string, unknown> | null | undefined
): boolean {
  if (!metadata) return false;

  const pending =
    metadata.portal_tour_pending === true ||
    metadata.portal_tour_pending === "true";

  return pending;
}

export function isRecentWorkspace(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false;
  const createdMs = new Date(createdAt).getTime();
  if (Number.isNaN(createdMs)) return false;
  return Date.now() - createdMs < RECENT_ORG_ONBOARDING_WINDOW_MS;
}
