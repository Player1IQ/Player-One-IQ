"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { platforms, type Platform } from "@/lib/creators/types";
import { setupCreatorPlayerWorkspace } from "@/lib/organization/creator-setup";
import { displayNameFromEmail } from "@/lib/team";
import {
  FUNNEL_SESSION_COOKIE,
  insertFunnelEvent,
  isFunnelSessionId,
} from "@/lib/marketing/funnel";

type CreatorPlayerSetupInput = {
  creatorName: string;
  primaryPlatform: Platform;
};

function validateCreatorPlayerSetup(
  input: CreatorPlayerSetupInput
): string | null {
  if (!input.creatorName.trim()) {
    return "Creator name is required.";
  }
  if (!platforms.includes(input.primaryPlatform)) {
    return "Invalid primary platform.";
  }
  return null;
}

export async function completeCreatorPlayerSetup(input: CreatorPlayerSetupInput) {
  const error = validateCreatorPlayerSetup(input);
  if (error) return { error };

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to complete setup." };
  }

  const result = await setupCreatorPlayerWorkspace(supabase, {
    userId: user.id,
    userEmail: user.email,
    creatorName: input.creatorName,
    primaryPlatform: input.primaryPlatform,
    skipOnboardingWizard: true,
  });

  if ("error" in result) {
    return result;
  }

  revalidatePath("/portal");
  revalidatePath("/portal/snapshot");
  revalidatePath("/");

  return { success: true as const, redirectTo: "/portal/snapshot" as const };
}

export async function autoBootstrapCreatorWorkspace(): Promise<
  { redirectTo: "/portal/snapshot" } | { error: string }
> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to complete setup." };
  }

  const { data: existingOrg } = await supabase
    .from("organizations")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingOrg) {
    return { redirectTo: "/portal/snapshot" };
  }

  const creatorName = user.email
    ? displayNameFromEmail(user.email)
    : "Creator";

  const result = await setupCreatorPlayerWorkspace(supabase, {
    userId: user.id,
    userEmail: user.email,
    creatorName,
    primaryPlatform: "Twitch",
    skipOnboardingWizard: true,
  });

  if ("error" in result) {
    if (result.error.includes("already have a workspace")) {
      return { redirectTo: "/portal/snapshot" };
    }
    return result;
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(FUNNEL_SESSION_COOKIE)?.value;
  if (sessionId && isFunnelSessionId(sessionId)) {
    await insertFunnelEvent({ sessionId, event: "signup" });
  }

  revalidatePath("/portal");
  revalidatePath("/portal/snapshot");
  revalidatePath("/");

  return { redirectTo: "/portal/snapshot" };
}
