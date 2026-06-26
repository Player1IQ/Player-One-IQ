import { execSync } from "child_process";
import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { login } from "./helpers/auth";
import {
  fillDateTimeRange,
  saveModalAndWait,
  selectTomorrowInWeekView,
} from "./helpers/schedule";

type QaCredentials = {
  password: string;
  organizationId: string;
  staff: { email: string };
  creator: { email: string };
  member: { email: string };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasSupabaseEnv = Boolean(supabaseUrl && serviceRoleKey);

let credentials: QaCredentials;

function loadCredentialsFromEnv(): QaCredentials | null {
  const staffEmail = process.env.QA_STAFF_EMAIL;
  const creatorEmail = process.env.QA_CREATOR_EMAIL;
  const memberEmail = process.env.QA_MEMBER_EMAIL;
  const password = process.env.QA_SCHEDULE_PASSWORD;
  const organizationId = process.env.QA_ORG_ID;

  if (!staffEmail || !creatorEmail || !memberEmail || !password || !organizationId) {
    return null;
  }

  return {
    password,
    organizationId,
    staff: { email: staffEmail },
    creator: { email: creatorEmail },
    member: { email: memberEmail },
  };
}

function provisionCredentials(): QaCredentials {
  const output = execSync("npx tsx scripts/provision-schedule-qa.ts", {
    encoding: "utf8",
    cwd: process.cwd(),
  });
  const marker = "SCHEDULE_QA_CREDENTIALS_JSON";
  const markerIndex = output.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error("provision-schedule-qa.ts did not print credentials marker");
  }
  const jsonStart = output.indexOf("{", markerIndex);
  if (jsonStart === -1) {
    throw new Error("provision-schedule-qa.ts did not print credentials JSON");
  }
  const parsed = JSON.parse(output.slice(jsonStart)) as {
    password: string;
    organizationId: string;
    staff: { email: string };
    creator: { email: string };
    member: { email: string };
  };
  return {
    password: parsed.password,
    organizationId: parsed.organizationId,
    staff: { email: parsed.staff.email },
    creator: { email: parsed.creator.email },
    member: { email: parsed.member.email },
  };
}

async function resetScheduleEvents(organizationId: string) {
  if (!supabaseUrl || !serviceRoleKey) return;
  const sb = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  await sb.from("schedule_events").delete().eq("organization_id", organizationId);
}

test.describe("schedule flows", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(60_000);

  test.beforeAll(() => {
    test.skip(!hasSupabaseEnv, "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
    credentials = loadCredentialsFromEnv() ?? provisionCredentials();
  });

  test.beforeEach(async () => {
    await resetScheduleEvents(credentials.organizationId);
  });

  test.afterAll(async () => {
    if (credentials?.organizationId) {
      await resetScheduleEvents(credentials.organizationId);
    }
  });

  test("staff cannot save event overlapping creator block", async ({ page }) => {
    await login(page, credentials.creator.email, credentials.password);
    await selectTomorrowInWeekView(page);
    await page.getByRole("button", { name: "Block time" }).click();
    await fillDateTimeRange(page, 14, 16);
    await saveModalAndWait(page);

    await page.context().clearCookies();

    await login(page, credentials.staff.email, credentials.password);
    await selectTomorrowInWeekView(page);
    await page.getByRole("button", { name: "New event" }).click();
    await page.getByPlaceholder("Team sync").fill("QA Conflict Meeting");
    await fillDateTimeRange(page, 14, 16);

    const creatorCheckbox = page
      .locator("label")
      .filter({ hasText: /QA Schedule Creator/i })
      .locator('input[type="checkbox"]');
    await creatorCheckbox.check();

    const conflictWarning = page.getByText(/Cannot schedule during this time/i);
    await expect(conflictWarning).toBeVisible({ timeout: 3000 });

    const saveButton = page.getByRole("button", { name: "Save" });
    await expect(saveButton).toBeDisabled();

    await saveButton.click({ force: true });
    await expect(page.getByRole("heading", { name: /New event/i })).toBeVisible();
    await expect(page.getByText("QA Conflict Meeting")).not.toBeVisible();
  });

  test("staff creates non-overlapping event successfully", async ({ page }) => {
    await login(page, credentials.staff.email, credentials.password);
    await selectTomorrowInWeekView(page);
    await page.getByRole("button", { name: "New event" }).click();
    await page.getByPlaceholder("Team sync").fill("QA Team Sync");
    await fillDateTimeRange(page, 10, 11);

    const creatorCheckbox = page
      .locator("label")
      .filter({ hasText: /QA Schedule Creator/i })
      .locator('input[type="checkbox"]');
    await creatorCheckbox.check();

    await saveModalAndWait(page);
    await expect(
      page.getByRole("button", { name: /QA Team Sync/i }).first()
    ).toBeVisible();
  });

  test("creator sees accept button on invited event", async ({ page }) => {
    await login(page, credentials.staff.email, credentials.password);
    await selectTomorrowInWeekView(page);
    await page.getByRole("button", { name: "New event" }).click();
    await page.getByPlaceholder("Team sync").fill("QA Invite Event");
    await fillDateTimeRange(page, 10, 11);

    const creatorCheckbox = page
      .locator("label")
      .filter({ hasText: /QA Schedule Creator/i })
      .locator('input[type="checkbox"]');
    await creatorCheckbox.check();
    await saveModalAndWait(page);

    await page.context().clearCookies();

    await login(page, credentials.creator.email, credentials.password);
    await selectTomorrowInWeekView(page);

    const eventCard = page.locator("li").filter({ hasText: "QA Invite Event" });
    await expect(eventCard).toBeVisible({ timeout: 15_000 });
    await expect(eventCard.getByRole("button", { name: "Accept" })).toBeVisible({
      timeout: 10_000,
    });
  });
});
