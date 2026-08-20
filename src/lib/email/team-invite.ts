import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/lib/i18n/locale";
import { roleLabels, type TeamRole } from "@/lib/team";

export function isInviteEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.INVITE_EMAIL_FROM);
}

interface TeamInviteEmailParams {
  to: string;
  inviteUrl: string;
  organizationName: string;
  role: TeamRole;
  inviterEmail?: string | null;
  isResend?: boolean;
}

function buildInviteEmailText(
  params: TeamInviteEmailParams,
  copy: {
    intro: string;
    introResend: string;
    role: string;
    invitedBy: string;
    acceptLabel: string;
    expires: string;
    ignore: string;
  }
): string {
  const roleLabel = roleLabels[params.role];
  const intro = params.isResend
    ? copy.introResend.replace("{organizationName}", params.organizationName)
    : copy.intro.replace("{organizationName}", params.organizationName);

  const lines = [
    intro,
    "",
    `${copy.role}: ${roleLabel}`,
    params.inviterEmail ? `${copy.invitedBy}: ${params.inviterEmail}` : null,
    "",
    copy.acceptLabel,
    params.inviteUrl,
    "",
    copy.expires,
    "",
    copy.ignore,
  ].filter(Boolean);

  return lines.join("\n");
}

async function buildInviteEmailHtml(
  params: TeamInviteEmailParams,
  copy: {
    heading: string;
    intro: string;
    introResend: string;
    role: string;
    invitedBy: string;
    acceptButton: string;
    copyLink: string;
    expires: string;
  }
): Promise<string> {
  const roleLabel = roleLabels[params.role];
  const intro = params.isResend
    ? copy.introResend.replace("{organizationName}", escapeHtml(params.organizationName))
    : copy.intro.replace("{organizationName}", escapeHtml(params.organizationName));

  return `
    <div style="font-family: Inter, Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 560px;">
      <p style="font-size: 18px; font-weight: 600; margin: 0 0 16px;">${escapeHtml(copy.heading)}</p>
      <p style="margin: 0 0 16px;">${intro}</p>
      <p style="margin: 0 0 8px;"><strong>${escapeHtml(copy.role)}:</strong> ${escapeHtml(roleLabel)}</p>
      ${
        params.inviterEmail
          ? `<p style="margin: 0 0 16px;"><strong>${escapeHtml(copy.invitedBy)}:</strong> ${escapeHtml(params.inviterEmail)}</p>`
          : ""
      }
      <p style="margin: 24px 0;">
        <a href="${params.inviteUrl}" style="display: inline-block; background: #7c3aed; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;">
          ${escapeHtml(copy.acceptButton)}
        </a>
      </p>
      <p style="margin: 0 0 16px; font-size: 14px; color: #4b5563;">
        ${escapeHtml(copy.copyLink)}<br />
        <a href="${params.inviteUrl}" style="color: #7c3aed; word-break: break-all;">${params.inviteUrl}</a>
      </p>
      <p style="margin: 0; font-size: 13px; color: #6b7280;">${escapeHtml(copy.expires)}</p>
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendTeamInviteEmail(
  params: TeamInviteEmailParams
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INVITE_EMAIL_FROM;

  const locale = await resolveLocale();
  const t = await getTranslations({ locale, namespace: "emails.teamInvite" });

  if (!apiKey || !from) {
    return {
      sent: false,
      error: t("notConfigured"),
    };
  }

  const copy = {
    heading: t("heading"),
    intro: t("intro"),
    introResend: t("introResend"),
    role: t("role"),
    invitedBy: t("invitedBy"),
    acceptButton: t("acceptButton"),
    acceptLabel: t("acceptButton"),
    copyLink: t("copyLink"),
    expires: t("expires"),
    ignore: t("ignore"),
  };

  const subject = params.isResend
    ? t("subjectResend", { organizationName: params.organizationName })
    : t("subject", { organizationName: params.organizationName });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject,
      html: await buildInviteEmailHtml(params, copy),
      text: buildInviteEmailText(params, copy),
    }),
  });

  if (!response.ok) {
    let errorMessage = "Failed to send invitation email.";
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) errorMessage = body.message;
    } catch {
      // Keep default message.
    }
    return { sent: false, error: errorMessage };
  }

  return { sent: true };
}
