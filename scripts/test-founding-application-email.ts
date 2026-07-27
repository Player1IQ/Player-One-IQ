import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { sendFoundingApplicationNotification } from "../src/lib/email/founding-application";

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

const notifyTo = process.env.FOUNDING_APPLICATION_NOTIFY_EMAIL?.trim();

if (!process.env.RESEND_API_KEY || !process.env.INVITE_EMAIL_FROM) {
  console.error("Missing RESEND_API_KEY or INVITE_EMAIL_FROM in .env.local");
  process.exit(1);
}

if (!notifyTo) {
  console.error(
    "Missing FOUNDING_APPLICATION_NOTIFY_EMAIL in .env.local or environment"
  );
  process.exit(1);
}

async function main() {
  const result = await sendFoundingApplicationNotification({
    applicantType: "creator",
    name: "Founding Email Test",
    creatorHandle: "@test-channel",
    email: "applicant@example.com",
    primaryPlatform: "YouTube",
    otherPlatforms: "Twitch",
    channelLinks: "https://youtube.com/@example",
    contentType: "Gaming",
    revenueSources: ["Subscriptions / Ads"],
    biggestManagementProblem:
      "This is a test notification from scripts/test-founding-application-email.ts",
    whyJoin: "Verifying Resend delivery for founding applications.",
    nominatedBy: "Internal test",
  });

  if (!result.sent) {
    console.error("Failed to send founding application notification:");
    console.error(result.error ?? "unknown error");
    console.error(
      "\nIf you see a 403 about resend.dev, verify playeroneiq.com in Resend and set INVITE_EMAIL_FROM to that domain."
    );
    process.exit(1);
  }

  console.log("Founding application test email sent to:", notifyTo);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
