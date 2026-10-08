import { createServiceClient } from "@/lib/supabase/admin";
import { getConfiguredAppUrl } from "@/lib/email/app-url";
import {
  getOpsAlertRecipients,
  isOpsAlertsConfigured,
  opsAlertFingerprint,
  shouldSendOpsAlert,
  type OpsAlertKind,
} from "./alerts-config";

export {
  OPS_ALERT_COOLDOWN_MS,
  evaluateHealthUptimeCheck,
  getOpsAlertRecipients,
  isOpsAlertsConfigured,
  opsAlertFingerprint,
  shouldSendOpsAlert,
} from "./alerts-config";
export type { OpsAlertKind } from "./alerts-config";

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

    const {
      escapeHtml,
      sendTransactionalEmail,
      wrapTransactionalEmailHtml,
    } = await import("@/lib/email/send");
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
        footer:
          "Launch-month ops alert. Repeats of the same issue are emailed at most every 30 minutes.",
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
