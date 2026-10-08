export const OPS_ALERT_COOLDOWN_MS = 30 * 60 * 1000;

export type OpsAlertKind =
  | "server_error"
  | "cron"
  | "email"
  | "oauth"
  | "uptime";

export function opsAlertFingerprint(kind: OpsAlertKind, title: string): string {
  return `${kind}:${title.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 180)}`;
}

export function shouldSendOpsAlert(
  lastSentAt: string | null | undefined,
  nowMs: number,
  cooldownMs = OPS_ALERT_COOLDOWN_MS
): boolean {
  if (!lastSentAt) return true;
  const last = new Date(lastSentAt).getTime();
  if (!Number.isFinite(last)) return true;
  return nowMs - last >= cooldownMs;
}

export function getOpsAlertRecipients(
  env: NodeJS.ProcessEnv = process.env
): string[] {
  return (env.FOUNDING_APPLICATION_NOTIFY_EMAIL ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.includes("@"));
}

export function isOpsAlertsConfigured(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  return Boolean(
    env.RESEND_API_KEY?.trim() &&
      env.INVITE_EMAIL_FROM?.trim() &&
      getOpsAlertRecipients(env).length > 0
  );
}

export interface HealthUptimePayload {
  ok?: unknown;
  supabase?: unknown;
}

export function evaluateHealthUptimeCheck(input: {
  status: number;
  body: unknown;
}): { ok: true } | { ok: false; reason: string } {
  if (input.status < 200 || input.status >= 300) {
    return { ok: false, reason: `Health HTTP ${input.status}` };
  }
  if (!input.body || typeof input.body !== "object") {
    return { ok: false, reason: "Health response was not JSON." };
  }
  const body = input.body as HealthUptimePayload;
  if (body.ok !== true) {
    return { ok: false, reason: "Health payload ok was not true." };
  }
  if (body.supabase !== true) {
    return { ok: false, reason: "Health reported Supabase as not configured." };
  }
  return { ok: true };
}

export function resolveOpsAlertIngestUrl(
  env: NodeJS.ProcessEnv = process.env
): string | null {
  const app = env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (app) return `${app}/api/ops/alert`;
  const vercel = env.VERCEL_URL?.replace(/\/$/, "");
  if (vercel) return `https://${vercel}/api/ops/alert`;
  return null;
}
