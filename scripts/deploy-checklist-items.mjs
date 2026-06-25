/**
 * Shared deploy checklist items (mirrors Settings → Deploy checklist).
 */

export const PUBLIC_ROUTE_CHECKS = [
  { path: "/login", label: "Login page reachable" },
  { path: "/signup", label: "Signup page reachable" },
  { path: "/terms", label: "Terms page reachable" },
  { path: "/privacy", label: "Privacy page reachable" },
  { path: "/robots.txt", label: "robots.txt served" },
  { path: "/sitemap.xml", label: "sitemap.xml served" },
];

export function checklistItemsFromHealth(health, options = {}) {
  const { aiIntegrationProbeError = null, aiIntegrationHasKey = false } =
    options;

  return [
    {
      label: "Supabase connected",
      done: health.supabase ?? false,
    },
    {
      label: "NEXT_PUBLIC_APP_URL (production URL)",
      done: Boolean(health.appUrl && !health.appUrl.includes("localhost")),
    },
    {
      label: "Cron secret (daily revenue sync)",
      done: health.cronConfigured ?? false,
    },
    {
      label: "Service role key (cron sync + Agency Pro API)",
      done: health.serviceRoleConfigured ?? false,
    },
    {
      label: "Agency Pro API v1 reachable",
      done: health.apiV1AuthReady ?? false,
    },
    {
      label: "Platform OAuth enabled",
      done: health.platformOAuth ?? false,
    },
    {
      label: `Launch OAuth platforms (${health.launchOAuthPlatforms?.join(", ") ?? "YouTube, Twitch"})`,
      done: health.platformOAuth ?? false,
    },
    {
      label: "Stripe billing keys",
      done: health.stripeConfigured ?? false,
    },
    {
      label: "Stripe webhook secret",
      done: health.stripeWebhookConfigured ?? false,
    },
    {
      label: "Team invite email (Resend)",
      done: health.resendConfigured ?? false,
    },
    {
      label: "AI key encryption (AI_CREDENTIALS_ENCRYPTION_KEY)",
      done: health.aiCredentialsEncryptionConfigured ?? false,
    },
    {
      label: "Live AI ready (BYOK or platform fallback)",
      done: health.aiDeployReady ?? false,
    },
    {
      label: "Workspace AI key verified",
      done: !aiIntegrationProbeError,
      optional: !aiIntegrationHasKey,
    },
    {
      label: "API key pepper (optional hardening)",
      done: health.apiKeyPepperConfigured ?? false,
      optional: true,
    },
    {
      label: "Platform OpenAI fallback (optional)",
      done: health.openAiConfigured ?? false,
      optional: !health.openAiConfigured,
    },
    {
      label: "Platform OpenAI billing active",
      done:
        !health.openAiConfigured || health.openAiHealth === "available",
      optional: !health.openAiConfigured,
    },
  ];
}
