import {
  scheduleEventTypeLabels,
  type ScheduleEventType,
} from "@/lib/schedule";
import { formatScheduleWhen } from "@/lib/schedule/helpers";

export function isScheduleEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.INVITE_EMAIL_FROM);
}

interface ScheduleEmailBaseParams {
  to: string;
  scheduleUrl: string;
  organizationName: string;
  eventTitle: string;
  startsAt: string;
  endsAt: string;
  allDay?: boolean;
  location?: string | null;
}

interface ScheduleInviteEmailParams extends ScheduleEmailBaseParams {
  eventType: ScheduleEventType;
  organizerEmail?: string | null;
}

type ScheduleUpdateEmailParams = ScheduleEmailBaseParams;

type ScheduleCancellationEmailParams = ScheduleEmailBaseParams;

export function scheduleCancellationEmailSubject(eventTitle: string): string {
  return `Schedule cancelled: ${eventTitle}`;
}

export function buildScheduleCancellationText(
  params: ScheduleCancellationEmailParams
): string {
  const when = formatScheduleWhen(
    params.startsAt,
    params.endsAt,
    params.allDay
  );

  const lines = [
    `A scheduled event on ${params.organizationName} has been cancelled.`,
    "",
    `Event: ${params.eventTitle}`,
    `When: ${when}`,
    params.location ? `Location: ${params.location}` : null,
    "",
    "View your schedule:",
    params.scheduleUrl,
  ].filter(Boolean);

  return lines.join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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

function buildScheduleUpdateText(params: ScheduleUpdateEmailParams): string {
  const when = formatScheduleWhen(
    params.startsAt,
    params.endsAt,
    params.allDay
  );

  const lines = [
    `A scheduled event on ${params.organizationName} has been updated.`,
    "",
    `Event: ${params.eventTitle}`,
    `When: ${when}`,
    params.location ? `Location: ${params.location}` : null,
    "",
    "View your schedule:",
    params.scheduleUrl,
  ].filter(Boolean);

  return lines.join("\n");
}

function buildScheduleEmailHtml(options: {
  heading: string;
  introHtml: string;
  params: ScheduleEmailBaseParams;
  extraHtml?: string;
}): string {
  const when = formatScheduleWhen(
    options.params.startsAt,
    options.params.endsAt,
    options.params.allDay
  );

  return `
    <div style="font-family: Inter, Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 560px;">
      <p style="font-size: 18px; font-weight: 600; margin: 0 0 16px;">${escapeHtml(options.heading)}</p>
      <p style="margin: 0 0 16px;">${options.introHtml}</p>
      <p style="margin: 0 0 8px;"><strong>Event:</strong> ${escapeHtml(options.params.eventTitle)}</p>
      <p style="margin: 0 0 8px;"><strong>When:</strong> ${escapeHtml(when)}</p>
      ${
        options.params.location
          ? `<p style="margin: 0 0 8px;"><strong>Location:</strong> ${escapeHtml(options.params.location)}</p>`
          : ""
      }
      ${options.extraHtml ?? ""}
      <p style="margin: 24px 0;">
        <a href="${options.params.scheduleUrl}" style="display: inline-block; background: #7c3aed; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;">
          View schedule
        </a>
      </p>
      <p style="margin: 0 0 16px; font-size: 14px; color: #4b5563;">
        Or copy this link into your browser:<br />
        <a href="${options.params.scheduleUrl}" style="color: #7c3aed; word-break: break-all;">${options.params.scheduleUrl}</a>
      </p>
    </div>
  `;
}

function buildScheduleInviteHtml(params: ScheduleInviteEmailParams): string {
  const typeLabel = scheduleEventTypeLabels[params.eventType];

  return buildScheduleEmailHtml({
    heading: "Schedule invitation",
    introHtml: `You've been invited to a <strong>${escapeHtml(typeLabel.toLowerCase())}</strong> on <strong>${escapeHtml(params.organizationName)}</strong>.`,
    params,
    extraHtml: params.organizerEmail
      ? `<p style="margin: 0 0 16px;"><strong>Organized by:</strong> ${escapeHtml(params.organizerEmail)}</p>`
      : "",
  });
}

function buildScheduleUpdateHtml(params: ScheduleUpdateEmailParams): string {
  return buildScheduleEmailHtml({
    heading: "Schedule updated",
    introHtml: `A scheduled event on <strong>${escapeHtml(params.organizationName)}</strong> has been updated.`,
    params,
  });
}

function buildScheduleCancellationHtml(
  params: ScheduleCancellationEmailParams
): string {
  return buildScheduleEmailHtml({
    heading: "Schedule cancelled",
    introHtml: `A scheduled event on <strong>${escapeHtml(params.organizationName)}</strong> has been cancelled.`,
    params,
  });
}

async function sendScheduleEmail(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INVITE_EMAIL_FROM;

  if (!apiKey || !from) {
    return { sent: false };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    }),
  });

  if (!response.ok) {
    let errorMessage = "Failed to send schedule email.";
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

export async function sendScheduleInviteEmail(
  params: ScheduleInviteEmailParams
): Promise<{ sent: boolean; error?: string }> {
  return sendScheduleEmail({
    to: params.to,
    subject: `Schedule invite: ${params.eventTitle}`,
    html: buildScheduleInviteHtml(params),
    text: buildScheduleInviteText(params),
  });
}

export async function sendScheduleUpdateEmail(
  params: ScheduleUpdateEmailParams
): Promise<{ sent: boolean; error?: string }> {
  return sendScheduleEmail({
    to: params.to,
    subject: `Schedule updated: ${params.eventTitle}`,
    html: buildScheduleUpdateHtml(params),
    text: buildScheduleUpdateText(params),
  });
}

export async function sendScheduleCancellationEmail(
  params: ScheduleCancellationEmailParams
): Promise<{ sent: boolean; error?: string }> {
  return sendScheduleEmail({
    to: params.to,
    subject: scheduleCancellationEmailSubject(params.eventTitle),
    html: buildScheduleCancellationHtml(params),
    text: buildScheduleCancellationText(params),
  });
}
