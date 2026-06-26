"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { platforms, type Platform } from "@/lib/creators/types";
import { setupCreatorPlayerWorkspace } from "@/lib/organization/creator-setup";

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
  });

  if ("error" in result) {
    return result;
  }

  revalidatePath("/portal");
  revalidatePath("/");

  return { success: true as const, redirectTo: "/portal" as const };
}
