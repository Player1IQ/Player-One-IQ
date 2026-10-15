"use server";

import { canManageSettings, getCurrentUserMembership } from "@/lib/permissions";
import { reportOpsAlert } from "@/lib/ops/alerts";
import { isOpsAlertsConfigured } from "@/lib/ops/alerts-config";

export async function sendTestOpsAlert(): Promise<
  { ok: true } | { error: string }
> {
  const membership = await getCurrentUserMembership();
  if (!membership || !canManageSettings(membership.role)) {
    return { error: "You do not have permission to send ops alerts." };
  }

  if (!isOpsAlertsConfigured()) {
    return {
      error:
        "Ops alerts are not configured. Set RESEND_API_KEY, INVITE_EMAIL_FROM, and FOUNDING_APPLICATION_NOTIFY_EMAIL.",
    };
  }

  await reportOpsAlert({
    kind: "server_error",
    title: `Test ops alert (${new Date().toISOString()})`,
    detail:
      "Manual test from Settings → Deploy checklist. If you received this, launch-month email alerts are working.",
  });

  return { ok: true };
}
