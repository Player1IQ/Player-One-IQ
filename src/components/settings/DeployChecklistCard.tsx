"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, ExternalLink, Loader2 } from "lucide-react";

const PUBLIC_ROUTE_CHECKS = [
  { path: "/login", label: "Login page reachable" },
  { path: "/signup", label: "Signup page reachable" },
  { path: "/terms", label: "Terms page reachable" },
  { path: "/privacy", label: "Privacy page reachable" },
  { path: "/robots.txt", label: "robots.txt served" },
  { path: "/sitemap.xml", label: "sitemap.xml served" },
] as const;

interface ChecklistItem {
  label: string;
  done: boolean;
  optional?: boolean;
}

interface HealthResponse {
  ok: boolean;
  supabase: boolean;
  platformOAuth: boolean;
  launchOAuthPlatforms: string[];
  cronConfigured: boolean;
  serviceRoleConfigured: boolean;
  stripeConfigured: boolean;
  stripeWebhookConfigured: boolean;
  resendConfigured: boolean;
  openAiConfigured?: boolean;
  openAiHealth?: "unconfigured" | "available" | "quota_exceeded" | "unavailable";
  aiCredentialsEncryptionConfigured?: boolean;
  aiDeployReady?: boolean;
  appUrl: string | null;
}

interface DeployChecklistCardProps {
  aiIntegrationHasKey?: boolean;
  aiIntegrationProbeError?: string | null;
}

export function DeployChecklistCard({
  aiIntegrationHasKey = false,
  aiIntegrationProbeError = null,
}: DeployChecklistCardProps) {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [routeChecks, setRouteChecks] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChecklist() {
      try {
        const [healthRes, routeResults] = await Promise.all([
          fetch("/api/health").then((res) => res.json() as Promise<HealthResponse>),
          Promise.all(
            PUBLIC_ROUTE_CHECKS.map(async ({ path, label }) => {
              try {
                const response = await fetch(path, { redirect: "follow" });
                return { label, done: response.ok };
              } catch {
                return { label, done: false };
              }
            })
          ),
        ]);
        setHealth(healthRes);
        setRouteChecks(routeResults);
      } catch {
        setHealth(null);
        setRouteChecks(
          PUBLIC_ROUTE_CHECKS.map(({ label }) => ({ label, done: false }))
        );
      } finally {
        setLoading(false);
      }
    }

    void loadChecklist();
  }, []);

  const envItems: ChecklistItem[] = [
    {
      label: "Supabase connected",
      done: health?.supabase ?? false,
    },
    {
      label: "NEXT_PUBLIC_APP_URL (production URL)",
      done: Boolean(health?.appUrl && !health.appUrl.includes("localhost")),
    },
    {
      label: "Cron secret (daily revenue sync)",
      done: health?.cronConfigured ?? false,
    },
    {
      label: "Service role key (scheduled sync)",
      done: health?.serviceRoleConfigured ?? false,
    },
    {
      label: "Platform OAuth enabled",
      done: health?.platformOAuth ?? false,
    },
    {
      label: `Launch OAuth platforms (${health?.launchOAuthPlatforms?.join(", ") ?? "YouTube, Twitch"})`,
      done: health?.platformOAuth ?? false,
    },
    {
      label: "Stripe billing keys",
      done: health?.stripeConfigured ?? false,
    },
    {
      label: "Stripe webhook secret",
      done: health?.stripeWebhookConfigured ?? false,
    },
    {
      label: "Team invite email (Resend)",
      done: health?.resendConfigured ?? false,
    },
    {
      label: "AI key encryption (AI_CREDENTIALS_ENCRYPTION_KEY)",
      done: health?.aiCredentialsEncryptionConfigured ?? false,
    },
    {
      label: "Live AI ready (BYOK or platform fallback)",
      done: health?.aiDeployReady ?? false,
    },
    {
      label: "Workspace AI key verified",
      done: !aiIntegrationProbeError,
      optional: !aiIntegrationHasKey,
    },
    {
      label: "Platform OpenAI fallback (optional)",
      done: health?.openAiConfigured ?? false,
    },
    {
      label: "Platform OpenAI billing active",
      done:
        !health?.openAiConfigured ||
        health.openAiHealth === "available",
      optional: !health?.openAiConfigured,
    },
  ];

  const items = [...envItems, ...routeChecks];

  const oauthBase = health?.appUrl?.replace(/\/$/, "");
  const requiredItems = items.filter((item) => !item.optional);
  const readyCount = requiredItems.filter((item) => item.done).length;

  return (
    <section className="rounded-xl border border-white/[0.06] bg-surface-raised/80 p-6">
      <h2 className="text-base font-semibold text-white">Deploy checklist</h2>
      <p className="mt-1 text-sm text-gray-500">
        Production readiness for Vercel. Run{" "}
        <code className="rounded bg-surface px-1 text-xs">npm run verify:launch</code>{" "}
        locally (or{" "}
        <code className="rounded bg-surface px-1 text-xs">npm run verify:production</code>{" "}
        against your deployed URL) before go-live.
      </p>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking environment…
        </div>
      ) : (
        <>
          <p className="mt-3 text-xs text-gray-500">
            {readyCount} of {requiredItems.length} required checks passing
          </p>
          <ul className="mt-3 space-y-2">
            {items.map((item) => (
              <li key={item.label} className="flex items-center gap-2 text-sm">
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-gray-600" />
                )}
                <span
                  className={
                    item.done
                      ? "text-gray-300"
                      : item.optional
                        ? "text-gray-600"
                        : "text-gray-500"
                  }
                >
                  {item.label}
                  {item.optional ? (
                    <span className="ml-1 text-xs text-gray-600">(skipped)</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>

          {!health?.aiCredentialsEncryptionConfigured ? (
            <p className="mt-3 text-xs text-amber-400/90">
              Add{" "}
              <code className="rounded bg-black/20 px-1 py-0.5">
                AI_CREDENTIALS_ENCRYPTION_KEY
              </code>{" "}
              on Vercel so workspaces can save API keys in Settings → AI
              integration.
            </p>
          ) : null}

          {health?.aiCredentialsEncryptionConfigured &&
          !health?.openAiConfigured ? (
            <p className="mt-2 text-xs text-gray-500">
              Platform{" "}
              <code className="rounded bg-surface px-1 py-0.5 text-[11px]">
                OPENAI_API_KEY
              </code>{" "}
              is optional — each workspace can connect its own provider key.
            </p>
          ) : null}

          {health?.openAiConfigured && health.openAiHealth === "quota_exceeded" ? (
            <p className="mt-3 text-xs text-amber-400/90">
              Platform OpenAI has no billing quota. Workspaces with their own key
              in Settings are unaffected; others see sample insights until billing
              is restored or BYOK is connected.
            </p>
          ) : null}

          {aiIntegrationProbeError ? (
            <p className="mt-3 text-xs text-amber-400/90">
              Your saved workspace AI key failed its last connection test:{" "}
              {aiIntegrationProbeError}. Open Settings → AI integration and run
              Test connection after verifying keys on Vercel.
            </p>
          ) : null}

          {!health?.appUrl || health.appUrl.includes("localhost") ? (
            <p className="mt-3 text-xs text-amber-400/90">
              Set{" "}
              <code className="rounded bg-black/20 px-1 py-0.5">
                NEXT_PUBLIC_APP_URL
              </code>{" "}
              to your Vercel URL (e.g. https://your-app.vercel.app) for OAuth
              redirects and invite emails.
            </p>
          ) : null}
        </>
      )}

      {oauthBase ? (
        <div className="mt-4 rounded-lg border border-white/[0.06] bg-surface px-4 py-3 text-xs text-gray-500">
          <p className="font-medium text-gray-400">OAuth callback base (v1)</p>
          <p className="mt-1 break-all font-mono text-gray-300">
            {oauthBase}/api/platform-oauth/youtube/callback
          </p>
          <p className="mt-1 break-all font-mono text-gray-300">
            {oauthBase}/api/platform-oauth/twitch/callback
          </p>
        </div>
      ) : null}

      <a
        href="https://vercel.com/docs/frameworks/nextjs"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1 text-sm text-accent-light hover:text-white"
      >
        Vercel Next.js docs
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </section>
  );
}
