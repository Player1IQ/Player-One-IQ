import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isPlatformOAuthFeatureEnabled } from "@/lib/platform-oauth/config";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? null;

  return NextResponse.json({
    ok: true,
    supabase: isSupabaseConfigured(),
    platformOAuth: isPlatformOAuthFeatureEnabled(),
    cronConfigured: Boolean(process.env.CRON_SECRET),
    serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    appUrl,
  });
}
