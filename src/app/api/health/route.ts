import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  isPlatformOAuthFeatureEnabled,
  launchOAuthPlatforms,
} from "@/lib/platform-oauth/config";
import {
  isStripeConfigured,
  getStripeWebhookSecret,
} from "@/lib/stripe/config";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? null;

  return NextResponse.json({
    ok: true,
    supabase: isSupabaseConfigured(),
    platformOAuth: isPlatformOAuthFeatureEnabled(),
    launchOAuthPlatforms,
    cronConfigured: Boolean(process.env.CRON_SECRET),
    serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    stripeConfigured: isStripeConfigured(),
    stripeWebhookConfigured: Boolean(getStripeWebhookSecret()),
    resendConfigured: Boolean(
      process.env.RESEND_API_KEY && process.env.INVITE_EMAIL_FROM
    ),
    appUrl,
  });
}
