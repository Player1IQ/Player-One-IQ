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

function buildInviteEmailText({
  inviteUrl,
  organizationName,
  role,
  inviterEmail,
  isResend,
}: TeamInviteEmailParams): string {
  const roleLabel = roleLabels[role];
  const intro = isResend
    ? `Here is a new invitation link to join ${organizationName} on Player One IQ.`
    : `You've been invited to join ${organizationName} on Player One IQ.`;

  const lines = [
    intro,
    "",
    `Role: ${roleLabel}`,
    inviterEmail ? `Invited by: ${inviterEmail}` : null,
    "",
    "Accept your invitation:",
    inviteUrl,
    "",
    "This link expires in 7 days.",
    "",
    "If you did not expect this invitation, you can ignore this email.",
  ].filter(Boolean);

  return lines.join("\n");
}

function buildInviteEmailHtml(params: TeamInviteEmailParams): string {
  const roleLabel = roleLabels[params.role];
  const intro = params.isResend
    ? `Here is a new invitation link to join <strong>${escapeHtml(params.organizationName)}</strong> on Player One IQ.`
    : `You've been invited to join <strong>${escapeHtml(params.organizationName)}</strong> on Player One IQ.`;

  return `
    <div style="font-family: Inter, Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 560px;">
      <p style="font-size: 18px; font-weight: 600; margin: 0 0 16px;">Team invitation</p>
      <p style="margin: 0 0 16px;">${intro}</p>
      <p style="margin: 0 0 8px;"><strong>Role:</strong> ${escapeHtml(roleLabel)}</p>
      ${
        params.inviterEmail
          ? `<p style="margin: 0 0 16px;"><strong>Invited by:</strong> ${escapeHtml(params.inviterEmail)}</p>`
          : ""
      }
      <p style="margin: 24px 0;">
        <a href="${params.inviteUrl}" style="display: inline-block; background: #7c3aed; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;">
          Accept invitation
        </a>
      </p>
      <p style="margin: 0 0 16px; font-size: 14px; color: #4b5563;">
        Or copy this link into your browser:<br />
        <a href="${params.inviteUrl}" style="color: #7c3aed; word-break: break-all;">${params.inviteUrl}</a>
      </p>
      <p style="margin: 0; font-size: 13px; color: #6b7280;">This link expires in 7 days.</p>
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

  if (!apiKey || !from) {
    return {
      sent: false,
      error: "Invitation email is not configured. Add RESEND_API_KEY and INVITE_EMAIL_FROM.",
    };
  }

  const subject = params.isResend
    ? `New invite to join ${params.organizationName}`
    : `You're invited to join ${params.organizationName}`;

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
      html: buildInviteEmailHtml(params),
      text: buildInviteEmailText(params),
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
