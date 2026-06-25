import { NextResponse } from "next/server";
import { isAiLlmConfigured } from "@/lib/ai/config";
import { getOpenAiHealth } from "@/lib/ai/openai-health";
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
  const openAiConfigured = isAiLlmConfigured();
  const aiCredentialsEncryptionConfigured = Boolean(
    process.env.AI_CREDENTIALS_ENCRYPTION_KEY?.trim()
  );
  const openAiHealth = openAiConfigured ? await getOpenAiHealth() : "unconfigured";
  const aiDeployReady =
    aiCredentialsEncryptionConfigured ||
    (openAiConfigured && openAiHealth === "available");
  const serviceRoleConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return NextResponse.json({
    ok: true,
    supabase: isSupabaseConfigured(),
    platformOAuth: isPlatformOAuthFeatureEnabled(),
    launchOAuthPlatforms,
    cronConfigured: Boolean(process.env.CRON_SECRET),
    serviceRoleConfigured,
    apiV1AuthReady: serviceRoleConfigured,
    apiKeyPepperConfigured: Boolean(process.env.API_KEY_PEPPER?.trim()),
    stripeConfigured: isStripeConfigured(),
    stripeWebhookConfigured: Boolean(getStripeWebhookSecret()),
    resendConfigured: Boolean(
      process.env.RESEND_API_KEY && process.env.INVITE_EMAIL_FROM
    ),
    openAiConfigured,
    openAiHealth,
    aiCredentialsEncryptionConfigured,
    aiDeployReady,
    appUrl,
  });
}
