"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  onboardingCompletedMetadata,
  onboardingPendingMetadata,
  portalTourCompletedMetadata,
  portalTourPendingMetadata,
  ONBOARDING_STARTED_COOKIE,
} from "@/lib/onboarding/state";
import { getOnboardingFlow } from "@/lib/onboarding/tour";
import { getCurrentUserMembership } from "@/lib/permissions";

export async function beginOnboarding() {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const { error } = await supabase.auth.updateUser({
    data: onboardingPendingMetadata(),
  });

  if (error) {
    return { error: error.message };
  }

  const cookieStore = await cookies();
  cookieStore.set(ONBOARDING_STARTED_COOKIE, "1", {
    path: "/",
    maxAge: 60 * 60,
    sameSite: "lax",
  });

  return { success: true as const };
}

export async function completeOnboarding() {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const membership = await getCurrentUserMembership();
  const flow = getOnboardingFlow(membership?.role ?? null);

  const { error } = await supabase.auth.updateUser({
    data: onboardingCompletedMetadata(),
  });

  if (error) {
    return { error: error.message };
  }

  const cookieStore = await cookies();
  cookieStore.delete(ONBOARDING_STARTED_COOKIE);

  revalidatePath("/onboarding");
  revalidatePath("/portal");
  revalidatePath("/portal/account");
  revalidatePath("/");

  return { success: true as const, redirectTo: `${flow.finishHref}?tour=1` };
}

export async function completePortalTour() {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const { error } = await supabase.auth.updateUser({
    data: portalTourCompletedMetadata(),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/portal");
  revalidatePath("/");
  revalidatePath("/portal/account");

  return { success: true as const };
}

export async function startPortalTour() {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const membership = await getCurrentUserMembership();
  const flow = getOnboardingFlow(membership?.role ?? null);

  const { error } = await supabase.auth.updateUser({
    data: portalTourPendingMetadata(),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/portal");
  revalidatePath("/");
  revalidatePath("/portal/account");

  return { success: true as const, redirectTo: `${flow.finishHref}?tour=1` };
}

/** Re-run the first-run setup guide on the current account (no new signup needed). */
export async function replayOnboarding() {
  const result = await beginOnboarding();
  if ("error" in result && result.error) {
    return result;
  }

  revalidatePath("/onboarding");
  revalidatePath("/portal");
  revalidatePath("/portal/account");
  revalidatePath("/");
  revalidatePath("/settings");

  return { success: true as const, redirectTo: "/onboarding?step=welcome" };
}
