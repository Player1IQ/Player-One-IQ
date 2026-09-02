export function isTransactionalEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.INVITE_EMAIL_FROM);
}

export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<{ sent: true } | { sent: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.INVITE_EMAIL_FROM?.trim();
  if (!apiKey || !from) {
    return { sent: false, error: "Transactional email is not configured." };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  });

  if (!response.ok) {
    let errorMessage = "Failed to send email.";
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) errorMessage = body.message;
    } catch {
      // Keep default.
    }
    return { sent: false, error: errorMessage };
  }

  return { sent: true };
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function wrapTransactionalEmailHtml(params: {
  heading: string;
  bodyHtml: string;
  actionUrl: string;
  actionLabel: string;
  footer: string;
}): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:24px;background:#0b0d12;font-family:Arial,sans-serif;color:#e5e7eb;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#141821;border:1px solid #1f2430;border-radius:12px;padding:24px;">
      <tr>
        <td>
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#9ca3af;">Player One IQ</p>
          <h1 style="margin:0 0 16px;font-size:20px;color:#ffffff;">${escapeHtml(params.heading)}</h1>
          ${params.bodyHtml}
          <p style="margin:24px 0 0;">
            <a href="${escapeHtml(params.actionUrl)}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:14px;">${escapeHtml(params.actionLabel)}</a>
          </p>
          <p style="margin:24px 0 0;font-size:12px;color:#6b7280;">${escapeHtml(params.footer)}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
