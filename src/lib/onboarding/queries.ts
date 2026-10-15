import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserMembership } from "@/lib/permissions";
import { getOnboardingFlow } from "./tour";
import {
  isPortalTourPending,
  ONBOARDING_STARTED_COOKIE,
  shouldShowOnboarding,
} from "./state";
import type { OnboardingFlow } from "./types";

export async function resolveOnboardingRequired(
  _supabase: SupabaseClient,
  user: User,
  options?: { startedCookie?: boolean }
): Promise<boolean> {
  if (
    shouldShowOnboarding(user.user_metadata, {
      startedCookie: options?.startedCookie,
    })
  ) {
    return true;
  }

  return false;
}

export async function getOnboardingContext(options?: {
  startedCookie?: boolean;
}): Promise<{
  required: boolean;
  flow: OnboardingFlow;
  userName: string | null;
  linkedCreatorId: string | null;
} | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const membership = await getCurrentUserMembership();
  const flow = getOnboardingFlow(membership?.role ?? null);
  const required = await resolveOnboardingRequired(supabase, user, options);

  return {
    required,
    flow,
    userName:
      (typeof user.user_metadata?.organization_name === "string"
        ? user.user_metadata.organization_name
        : null) ?? user.email ?? null,
    linkedCreatorId: membership?.linkedCreatorId ?? null,
  };
}

export { ONBOARDING_STARTED_COOKIE };

export async function resolvePortalTourPending(options?: {
  tourQueryParam?: boolean;
}): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) return Boolean(options?.tourQueryParam);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  return isPortalTourPending(user.user_metadata) || Boolean(options?.tourQueryParam);
}
