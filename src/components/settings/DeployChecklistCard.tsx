"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, ExternalLink, Loader2 } from "lucide-react";

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
  appUrl: string | null;
}

export function DeployChecklistCard() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data: HealthResponse) => setHealth(data))
      .catch(() => setHealth(null))
      .finally(() => setLoading(false));
  }, []);

  const items = [
    {
      label: "Supabase connected",
      done: health?.supabase ?? false,
    },
    {
      label: "Production app URL set",
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
  ];

  const oauthBase = health?.appUrl?.replace(/\/$/, "");
  const readyCount = items.filter((item) => item.done).length;

  return (
    <section className="rounded-xl border border-white/[0.06] bg-surface-raised/80 p-6">
      <h2 className="text-base font-semibold text-white">Deploy checklist</h2>
      <p className="mt-1 text-sm text-gray-500">
        Production readiness for Vercel. Run{" "}
        <code className="rounded bg-surface px-1 text-xs">npm run verify:deploy</code>{" "}
        locally before pushing.
      </p>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking environment…
        </div>
      ) : (
        <>
          <p className="mt-3 text-xs text-gray-500">
            {readyCount} of {items.length} checks passing
          </p>
          <ul className="mt-3 space-y-2">
            {items.map((item) => (
              <li key={item.label} className="flex items-center gap-2 text-sm">
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-gray-600" />
                )}
                <span className={item.done ? "text-gray-300" : "text-gray-500"}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
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
