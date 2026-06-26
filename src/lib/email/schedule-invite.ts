import { scheduleEventTypeLabels, type ScheduleEventType } from "@/lib/schedule";

export function isScheduleEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.INVITE_EMAIL_FROM);
}

interface ScheduleInviteEmailParams {
  to: string;
  scheduleUrl: string;
  organizationName: string;
  eventTitle: string;
  eventType: ScheduleEventType;
  startsAt: string;
  endsAt: string;
  allDay?: boolean;
  location?: string | null;
  organizerEmail?: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatScheduleWhen(
  startsAt: string,
  endsAt: string,
  allDay?: boolean
): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  if (allDay) {
    return start.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  const datePart = start.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const startTime = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const endTime = end.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${datePart} · ${startTime} – ${endTime}`;
}

function buildScheduleInviteText(params: ScheduleInviteEmailParams): string {
  const typeLabel = scheduleEventTypeLabels[params.eventType];
  const when = formatScheduleWhen(
    params.startsAt,
    params.endsAt,
    params.allDay
  );

  const lines = [
    `You've been invited to a ${typeLabel.toLowerCase()} on ${params.organizationName}.`,
    "",
    `Event: ${params.eventTitle}`,
    `When: ${when}`,
    params.location ? `Location: ${params.location}` : null,
    params.organizerEmail ? `Organized by: ${params.organizerEmail}` : null,
    "",
    "View your schedule and respond:",
    params.scheduleUrl,
    "",
    "If you did not expect this invitation, you can ignore this email.",
  ].filter(Boolean);

  return lines.join("\n");
}

function buildScheduleInviteHtml(params: ScheduleInviteEmailParams): string {
  const typeLabel = scheduleEventTypeLabels[params.eventType];
  const when = formatScheduleWhen(
    params.startsAt,
    params.endsAt,
    params.allDay
  );

  return `
    <div style="font-family: Inter, Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 560px;">
      <p style="font-size: 18px; font-weight: 600; margin: 0 0 16px;">Schedule invitation</p>
      <p style="margin: 0 0 16px;">
        You've been invited to a <strong>${escapeHtml(typeLabel.toLowerCase())}</strong>
        on <strong>${escapeHtml(params.organizationName)}</strong>.
      </p>
      <p style="margin: 0 0 8px;"><strong>Event:</strong> ${escapeHtml(params.eventTitle)}</p>
      <p style="margin: 0 0 8px;"><strong>When:</strong> ${escapeHtml(when)}</p>
      ${
        params.location
          ? `<p style="margin: 0 0 8px;"><strong>Location:</strong> ${escapeHtml(params.location)}</p>`
          : ""
      }
      ${
        params.organizerEmail
          ? `<p style="margin: 0 0 16px;"><strong>Organized by:</strong> ${escapeHtml(params.organizerEmail)}</p>`
          : ""
      }
      <p style="margin: 24px 0;">
        <a href="${params.scheduleUrl}" style="display: inline-block; background: #7c3aed; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;">
          View schedule
        </a>
      </p>
      <p style="margin: 0 0 16px; font-size: 14px; color: #4b5563;">
        Or copy this link into your browser:<br />
        <a href="${params.scheduleUrl}" style="color: #7c3aed; word-break: break-all;">${params.scheduleUrl}</a>
      </p>
    </div>
  `;
}

export async function sendScheduleInviteEmail(
  params: ScheduleInviteEmailParams
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INVITE_EMAIL_FROM;

  if (!apiKey || !from) {
    return { sent: false };
  }

  const subject = `Schedule invite: ${params.eventTitle}`;

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
      html: buildScheduleInviteHtml(params),
      text: buildScheduleInviteText(params),
    }),
  });

  if (!response.ok) {
    let errorMessage = "Failed to send schedule invitation email.";
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
