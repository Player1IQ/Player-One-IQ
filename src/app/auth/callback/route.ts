import { createClient } from "@/lib/supabase/server";
import { getPendingInvitationForUser } from "@/lib/team/queries";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

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
