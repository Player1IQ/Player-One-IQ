import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.INVITE_EMAIL_FROM;
const to = process.argv[2] ?? process.env.TEST_INVITE_EMAIL_TO;

if (!apiKey || !from) {
  console.error("Missing RESEND_API_KEY or INVITE_EMAIL_FROM in .env.local");
  console.error("Add them from .env.local.example, then rerun this script.");
  process.exit(1);
}

if (!to) {
  console.error("Usage: npx tsx scripts/test-invite-email.ts you@email.com");
  console.error("Or set TEST_INVITE_EMAIL_TO in .env.local");
  process.exit(1);
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const inviteUrl = `${appUrl.replace(/\/$/, "")}/invite/test-token-123`;

async function main() {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Player One IQ — invite email test",
      html: `<p>Test invite link: <a href="${inviteUrl}">${inviteUrl}</a></p>`,
      text: `Test invite link: ${inviteUrl}`,
    }),
  });

  const body = await response.text();

  if (!response.ok) {
    console.error("Resend API error:", response.status, body);
    process.exit(1);
  }

  console.log("Invite test email sent successfully to", to);
  console.log(body);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
