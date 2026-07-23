import { createClient } from "@/lib/supabase/server";
import { sanitizeInternalRedirectPath } from "@/lib/auth/safe-redirect";
import { getPendingInvitationForUser } from "@/lib/team/queries";
import { STAFF_DASHBOARD_PATH } from "@/lib/routes";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeInternalRedirectPath(
    searchParams.get("next"),
    STAFF_DASHBOARD_PATH
  );

  if (code) {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.redirect(`${origin}/login?error=supabase_not_configured`);
    }
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (next.startsWith("/organization-setup")) {
        const pendingToken = await getPendingInvitationForUser();
        if (pendingToken) {
          return NextResponse.redirect(`${origin}/invite/${pendingToken}`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
