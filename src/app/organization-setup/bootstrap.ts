import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { setupCreatorPlayerWorkspace } from "@/lib/organization/creator-setup";
import { displayNameFromEmail } from "@/lib/team";
import {
  FUNNEL_SESSION_COOKIE,
  insertFunnelEvent,
  isFunnelSessionId,
} from "@/lib/marketing/funnel";

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
    await insertFunnelEvent({
      sessionId,
      event: "signup",
      email: user.email,
    });
  }

  return { redirectTo: "/portal/snapshot" };
}
