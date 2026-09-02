import { getConfiguredAppUrl } from "@/lib/email/app-url";
import {
  escapeHtml,
  wrapTransactionalEmailHtml,
} from "@/lib/email/send";

function manageUrl(isPortalUser: boolean): string {
  const origin = getConfiguredAppUrl();
  return isPortalUser
    ? `${origin}/portal/account#notifications`
    : `${origin}/settings#notifications`;
}

function footer(isPortalUser: boolean): string {
  return `Manage email notifications: ${manageUrl(isPortalUser)}`;
}

export function buildDeadlineEmail(params: {
  heading: string;
  subject: string;
  lines: string[];
  actionUrl: string;
  actionLabel: string;
  isPortalUser: boolean;
}): { subject: string; text: string; html: string } {
  const text = [...params.lines, "", footer(params.isPortalUser)].join("\n");
  const html = wrapTransactionalEmailHtml({
    heading: params.heading,
    bodyHtml: params.lines
      .map((line) => `<p style="margin:0 0 8px;font-size:14px;color:#d1d5db;">${escapeHtml(line)}</p>`)
      .join(""),
    actionUrl: params.actionUrl,
    actionLabel: params.actionLabel,
    footer: footer(params.isPortalUser),
  });
  return { subject: params.subject, text, html };
}
