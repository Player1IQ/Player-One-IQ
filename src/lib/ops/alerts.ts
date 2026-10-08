import { createServiceClient } from "@/lib/supabase/admin";
import { getConfiguredAppUrl } from "@/lib/email/app-url";
import {
  escapeHtml,
  sendTransactionalEmail,
  wrapTransactionalEmailHtml,
} from "@/lib/email/send";

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

export async function reportOpsAlert(input: {
  kind: OpsAlertKind;
  title: string;
  detail?: string;
}): Promise<void> {
  try {
    if (!isOpsAlertsConfigured()) return;

    const fingerprint = opsAlertFingerprint(input.kind, input.title);
    const supabase = createServiceClient();
    const now = new Date();
    let lastSentAt: string | null = null;

    if (supabase) {
      const { data: existing } = await supabase
        .from("ops_alert_events")
        .select("last_sent_at, hit_count")
        .eq("fingerprint", fingerprint)
        .maybeSingle();

      lastSentAt = (existing?.last_sent_at as string | null) ?? null;
      const nextCount = (existing?.hit_count ?? 0) + 1;

      await supabase.from("ops_alert_events").upsert(
        {
          fingerprint,
          kind: input.kind,
          title: input.title,
          last_detail: input.detail ?? null,
          hit_count: nextCount,
          updated_at: now.toISOString(),
          last_sent_at: lastSentAt,
        },
        { onConflict: "fingerprint" }
      );
    }

    if (!shouldSendOpsAlert(lastSentAt, now.getTime())) return;

    const recipients = getOpsAlertRecipients();
    const appUrl = getConfiguredAppUrl();
    const detail = input.detail?.trim() || "No additional detail.";
    const result = await sendTransactionalEmail({
      to: recipients,
      subject: `[Player One IQ] ${input.title}`,
      skipOpsAlert: true,
      text: `${input.title}\n\n${detail}\n\nKind: ${input.kind}\n${appUrl}`,
      html: wrapTransactionalEmailHtml({
        heading: input.title,
        bodyHtml: `<p style="margin:0 0 12px;font-size:14px;color:#d1d5db;">${escapeHtml(detail)}</p><p style="margin:0;font-size:12px;color:#9ca3af;">Kind: ${escapeHtml(input.kind)}</p>`,
        actionUrl: `${appUrl}/api/health`,
        actionLabel: "Open health",
        footer: "Launch-month ops alert. Repeats of the same issue are emailed at most every 30 minutes.",
      }),
    });

    if (result.sent && supabase) {
      await supabase
        .from("ops_alert_events")
        .update({ last_sent_at: now.toISOString() })
        .eq("fingerprint", fingerprint);
    }
  } catch (error) {
    console.error(
      "[ops] alert failed",
      error instanceof Error ? error.message : error
    );
  }
}
