import type { FoundingApplicationInput } from "@/lib/founding/types";

export function isFoundingApplicationEmailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY &&
      process.env.INVITE_EMAIL_FROM &&
      process.env.FOUNDING_APPLICATION_NOTIFY_EMAIL?.trim()
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatField(label: string, value: string | null | undefined): string {
  if (!value?.trim()) return "";
  return `${label}: ${value.trim()}`;
}

function buildApplicationSummary(input: FoundingApplicationInput): string {
  const lines = [
    formatField("Type", input.applicantType),
    formatField("Name", input.name),
    formatField(
      input.applicantType === "organization" ? "Organization" : "Creator / handle",
      input.creatorHandle
    ),
    formatField("Email", input.email),
    formatField("Primary platform", input.primaryPlatform),
    formatField("Other platforms", input.otherPlatforms),
    formatField("Links", input.channelLinks),
    formatField(
      input.applicantType === "organization" ? "About" : "Content type",
      input.contentType
    ),
    input.applicantType === "creator" && input.revenueSources.length > 0
      ? `Revenue sources: ${input.revenueSources.join(", ")}`
      : "",
    "",
    "Biggest management challenge:",
    input.biggestManagementProblem.trim(),
    "",
    "Why they want to join:",
    input.whyJoin.trim(),
    input.nominatedBy?.trim()
      ? `\nNominated by: ${input.nominatedBy.trim()}`
      : "",
  ].filter(Boolean);

  return lines.join("\n");
}

function buildApplicationHtml(input: FoundingApplicationInput): string {
  const typeLabel =
    input.applicantType === "organization" ? "Organization" : "Creator";
  const rows = [
    ["Type", typeLabel],
    ["Name", input.name],
    [
      input.applicantType === "organization" ? "Organization" : "Creator / handle",
      input.creatorHandle,
    ],
    ["Email", input.email],
    ["Primary platform", input.primaryPlatform],
    ["Other platforms", input.otherPlatforms],
    ["Links", input.channelLinks],
    [
      input.applicantType === "organization" ? "About" : "Content type",
      input.contentType,
    ],
    input.applicantType === "creator"
      ? ["Revenue sources", input.revenueSources.join(", ")]
      : null,
    input.nominatedBy?.trim() ? ["Nominated by", input.nominatedBy] : null,
  ].filter(
    (row): row is [string, string | undefined] =>
      Boolean(row && row[1]?.trim())
  );

  const tableRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding: 8px 12px 8px 0; font-size: 13px; color: #6b7280; vertical-align: top; white-space: nowrap;">${escapeHtml(label)}</td>
          <td style="padding: 8px 0; font-size: 14px; color: #111827; vertical-align: top;">${escapeHtml(value ?? "")}</td>
        </tr>
      `
    )
    .join("");

  return `
    <div style="font-family: Inter, Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 640px;">
      <p style="font-size: 18px; font-weight: 600; margin: 0 0 8px;">New Founding Roster application</p>
      <p style="margin: 0 0 24px; font-size: 14px; color: #6b7280;">
        A new ${escapeHtml(typeLabel.toLowerCase())} application was submitted on playeroneiq.com/founding.
      </p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        ${tableRows}
      </table>
      <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em;">Biggest management challenge</p>
      <p style="margin: 0 0 24px; font-size: 14px; white-space: pre-wrap;">${escapeHtml(input.biggestManagementProblem.trim())}</p>
      <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em;">Why they want to join</p>
      <p style="margin: 0; font-size: 14px; white-space: pre-wrap;">${escapeHtml(input.whyJoin.trim())}</p>
    </div>
  `;
}

export async function sendFoundingApplicationNotification(
  input: FoundingApplicationInput
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INVITE_EMAIL_FROM;
  const notifyTo = process.env.FOUNDING_APPLICATION_NOTIFY_EMAIL?.trim();

  if (!apiKey || !from || !notifyTo) {
    return {
      sent: false,
      error:
        "Founding application email is not configured. Add RESEND_API_KEY, INVITE_EMAIL_FROM, and FOUNDING_APPLICATION_NOTIFY_EMAIL.",
    };
  }

  const recipients = notifyTo
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    return { sent: false, error: "FOUNDING_APPLICATION_NOTIFY_EMAIL is empty." };
  }

  const typeLabel =
    input.applicantType === "organization" ? "Organization" : "Creator";
  const subject = `New Founding Roster application: ${input.name} (${typeLabel})`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: recipients,
      subject,
      html: buildApplicationHtml(input),
      text: buildApplicationSummary(input),
      reply_to: input.email.trim(),
    }),
  });

  if (!response.ok) {
    let errorMessage = "Failed to send founding application notification.";
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
