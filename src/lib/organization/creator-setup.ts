import type { SupabaseClient } from "@supabase/supabase-js";
import { creatorPlayerOrgType } from "@/lib/organization";
import { onboardingPendingMetadata } from "@/lib/onboarding/state";
import { platforms, type Platform } from "@/lib/creators";
export interface SetupCreatorPlayerWorkspaceInput {
  userId: string;
  userEmail?: string | null;
  creatorName: string;
  primaryPlatform: Platform;
}

function formatBootstrapError(message: string): string {
  if (message.includes("Not authenticated")) {
    return "Your session expired. Please sign out, sign in again, and retry setup.";
  }
  if (message.includes("Organization already exists")) {
    return "You already have a workspace. Try signing in again.";
  }
  return message;
}

export async function setupCreatorPlayerWorkspace(
  supabase: SupabaseClient,
  input: SetupCreatorPlayerWorkspaceInput
): Promise<{ success: true } | { error: string }> {
  const creatorName = input.creatorName.trim();

  if (!creatorName) {
    return { error: "Creator name is required." };
  }

  if (!platforms.includes(input.primaryPlatform)) {
    return { error: "Invalid primary platform." };
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    return { error: formatBootstrapError(sessionError.message) };
  }

  if (!session?.access_token) {
    return {
      error:
        "Your session expired. Please sign out, sign in again, and retry setup.",
    };
  }

  const { error: rpcError } = await supabase.rpc(
    "bootstrap_creator_player_workspace",
    {
      p_creator_name: creatorName,
      p_primary_platform: input.primaryPlatform,
    }
  );

  if (rpcError) {
    return { error: formatBootstrapError(rpcError.message) };
  }

  const metadata = {
    organization_name: creatorName,
    organization_type: creatorPlayerOrgType,
    ...onboardingPendingMetadata(),
  };

  const { error: metadataError } = await supabase.auth.updateUser({
    data: metadata,
  });

  if (metadataError) {
    return { error: metadataError.message };
  }

  await supabase.auth.refreshSession();

  return { success: true };
}
