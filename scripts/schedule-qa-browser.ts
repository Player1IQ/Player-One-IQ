/**
 * One-off browser QA for schedule flows. Run after provision-schedule-qa.ts.
 *
 * Usage:
 *   npx tsx scripts/schedule-qa-browser.ts
 */

import { chromium, type Page } from "playwright";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

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

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const PASSWORD = process.env.QA_SCHEDULE_PASSWORD ?? "ScheduleQa!2026";
const ORG_ID = process.env.QA_ORG_ID ?? "1adcaafa-84a8-42d2-9379-bdef14e6e604";

const STAFF_EMAIL =
  process.env.QA_STAFF_EMAIL ?? "schedule-qa-staff-06e830e7@example.com";
const CREATOR_EMAIL =
  process.env.QA_CREATOR_EMAIL ?? "schedule-qa-creator-06e830e7@example.com";
const MEMBER_EMAIL =
  process.env.QA_MEMBER_EMAIL ?? "schedule-qa-member-06e830e7@example.com";

type ScenarioResult = { id: string; pass: boolean; notes: string };

const results: ScenarioResult[] = [];

function tomorrowAt(hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, minute, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

function tomorrowDayNumber(): number {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.getDate();
}

async function resetScheduleEvents() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  const sb = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  await sb.from("schedule_events").delete().eq("organization_id", ORG_ID);
}

async function dismissModals(page: Page) {
  for (let i = 0; i < 3; i++) {
    const skipTour = page.getByRole("button", { name: /skip tour/i });
    if (await skipTour.isVisible({ timeout: 1500 }).catch(() => false)) {
      await skipTour.click();
      await page.waitForTimeout(500);
    }
    const skipOnboarding = page.getByRole("button", { name: /skip for now/i });
    if (await skipOnboarding.isVisible({ timeout: 1000 }).catch(() => false)) {
      await skipOnboarding.click();
      await page.waitForTimeout(500);
    }
    const closeBtn = page.getByRole("button", { name: /^close$/i });
    if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
  }
}

async function login(page: Page, email: string, redirect = "/schedule") {
  await page.goto(`${BASE}/login?redirect=${encodeURIComponent(redirect)}`);
  await page.getByLabel("Email address").fill(email);
  await page.locator("#password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(
    (url) => url.pathname === redirect || url.pathname.startsWith(`${redirect}/`),
    { timeout: 20000 }
  );
  await page.waitForLoadState("networkidle");
  await dismissModals(page);
}

async function saveModalAndWait(page: Page) {
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForTimeout(500);
  const modalError = page.locator("form .text-red-400");
  if (await modalError.isVisible({ timeout: 1000 }).catch(() => false)) {
    const msg = await modalError.textContent();
    throw new Error(msg ?? "Save failed");
  }
  await page.getByRole("heading", { name: /Block time|New event|Edit event/ }).waitFor({
    state: "hidden",
    timeout: 10000,
  });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
}

async function selectTomorrowInWeekView(page: Page) {
  const dayNum = String(tomorrowDayNumber());
  const dayButton = page
    .locator("button")
    .filter({ has: page.locator(`p:text-is("${dayNum}")`) })
    .first();
  await dayButton.click();
}

async function fillDateTimeRange(page: Page, startHour: number, endHour: number) {
  const starts = tomorrowAt(startHour);
  const ends = tomorrowAt(endHour);
  await page.locator('input[type="datetime-local"]').first().fill(starts);
  await page.locator('input[type="datetime-local"]').nth(1).fill(ends);
}

async function main() {
  await resetScheduleEvents();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const conflictEventTitle = "QA Conflict Meeting";
  const multiEventTitle = "QA Team Sync";

  try {
    // A: Creator blocks tomorrow 2-4pm
    try {
      await login(page, CREATOR_EMAIL);
      await selectTomorrowInWeekView(page);
      const blockBtn = page.getByRole("button", { name: "Block time" });
      await blockBtn.waitFor({ state: "visible", timeout: 5000 });
      await blockBtn.click();
      await fillDateTimeRange(page, 14, 16);
      await saveModalAndWait(page);
      await selectTomorrowInWeekView(page);
      const blockedVisible = await page
        .locator("li, button")
        .filter({ hasText: /^Blocked$/ })
        .first()
        .isVisible({ timeout: 5000 });
      results.push({
        id: "A",
        pass: blockedVisible,
        notes: blockedVisible
          ? "Creator saved block for tomorrow 2–4pm"
          : "Block event not visible after save",
      });
    } catch (e) {
      results.push({
        id: "A",
        pass: false,
        notes: `Error: ${e instanceof Error ? e.message : String(e)}`,
      });
    }

    await context.clearCookies();

    // B: Staff creates overlapping event with creator, sees conflict warning
    try {
      await login(page, STAFF_EMAIL);
      await selectTomorrowInWeekView(page);
      await page.getByRole("button", { name: "New event" }).click();
      await page.getByPlaceholder("Team sync").fill(conflictEventTitle);
      await fillDateTimeRange(page, 14, 16);

      const creatorCheckbox = page
        .locator("label")
        .filter({ hasText: /QA Schedule Creator/i })
        .locator('input[type="checkbox"]');
      await creatorCheckbox.check();

      const conflictWarning = page.getByText(/overlaps with a creator block/i);
      const hasConflict = await conflictWarning.isVisible({ timeout: 3000 });
      await saveModalAndWait(page);
      const eventVisible = await page.getByText(conflictEventTitle).isVisible();

      results.push({
        id: "B",
        pass: hasConflict && eventVisible,
        notes: `Conflict warning: ${hasConflict ? "yes" : "no"}; event saved: ${eventVisible ? "yes" : "no"}`,
      });
    } catch (e) {
      results.push({
        id: "B",
        pass: false,
        notes: `Error: ${e instanceof Error ? e.message : String(e)}`,
      });
    }

    // C: Staff creates event with creator + member participants
    try {
      await selectTomorrowInWeekView(page);
      await page.getByRole("button", { name: "New event" }).click();
      await page.getByPlaceholder("Team sync").fill(multiEventTitle);
      await fillDateTimeRange(page, 10, 11);

      const creatorCb = page
        .locator("label")
        .filter({ hasText: /QA Schedule Creator/i })
        .locator('input[type="checkbox"]');
      await creatorCb.check();

      const memberCb = page
        .locator("label")
        .filter({ hasText: "Team member (member)" })
        .locator('input[type="checkbox"]');
      await memberCb.check();

      await saveModalAndWait(page);

      const eventVisible = await page.getByText(multiEventTitle).isVisible();
      const participantCount = await page
        .getByText(/\d+ participant/)
        .first()
        .isVisible()
        .catch(() => false);

      results.push({
        id: "C",
        pass: eventVisible && participantCount,
        notes: `Event visible: ${eventVisible}; participant count shown: ${participantCount}`,
      });
    } catch (e) {
      results.push({
        id: "C",
        pass: false,
        notes: `Error: ${e instanceof Error ? e.message : String(e)}`,
      });
    }

    await context.clearCookies();

    // D: Creator accepts conflict event, declines team sync
    try {
      await login(page, CREATOR_EMAIL);
      await selectTomorrowInWeekView(page);

      const conflictCard = page
        .locator("li")
        .filter({ hasText: conflictEventTitle });
      await conflictCard.getByRole("button", { name: "Accept" }).click();
      await page.waitForTimeout(1500);

      const syncCard = page.locator("li").filter({ hasText: multiEventTitle });
      const declineBtn = syncCard.getByRole("button", { name: "Decline" });
      if (await declineBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await declineBtn.click();
        await page.waitForTimeout(1500);
      }

      const accepted = await conflictCard.getByText("accepted").isVisible();
      const declined = await syncCard.getByText("declined").isVisible();

      results.push({
        id: "D",
        pass: accepted && declined,
        notes: `Accept on conflict event: ${accepted ? "yes" : "no"}; Decline on team sync: ${declined ? "yes" : "no"}`,
      });
    } catch (e) {
      results.push({
        id: "D",
        pass: false,
        notes: `Error: ${e instanceof Error ? e.message : String(e)}`,
      });
    }

    await context.clearCookies();

    // E: Member accept/decline
    try {
      await login(page, MEMBER_EMAIL);
      await selectTomorrowInWeekView(page);

      const syncCard = page.locator("li").filter({ hasText: multiEventTitle });
      const hasInvite = await syncCard.isVisible({ timeout: 5000 });

      if (hasInvite) {
        await syncCard.getByRole("button", { name: "Accept" }).click();
        await page.waitForTimeout(1500);
        const accepted = await syncCard.getByText("accepted").isVisible();
        results.push({
          id: "E",
          pass: accepted,
          notes: accepted
            ? "Member accepted team sync invite"
            : "Accept did not update status",
        });
      } else {
        results.push({
          id: "E",
          pass: false,
          notes: "Team sync event not visible to member",
        });
      }
    } catch (e) {
      results.push({
        id: "E",
        pass: false,
        notes: `Error: ${e instanceof Error ? e.message : String(e)}`,
      });
    }

    await context.clearCookies();

    // F: Staff verifies response summary
    try {
      await login(page, STAFF_EMAIL);
      await selectTomorrowInWeekView(page);

      const conflictSummary = page
        .locator("li")
        .filter({ hasText: conflictEventTitle })
        .getByText(/accepted|pending|declined/i);
      const syncSummary = page
        .locator("li")
        .filter({ hasText: multiEventTitle })
        .getByText(/accepted|pending|declined/i);

      const conflictText = (await conflictSummary.textContent()) ?? "";
      const syncText = (await syncSummary.textContent()) ?? "";

      const conflictOk = /1 accepted/.test(conflictText);
      const syncOk =
        (/2 accepted/.test(syncText) || /1 accepted/.test(syncText)) &&
        !/pending/.test(syncText);

      results.push({
        id: "F",
        pass: conflictOk && syncOk,
        notes: `Conflict event: "${conflictText.trim()}"; Team sync: "${syncText.trim()}"`,
      });
    } catch (e) {
      results.push({
        id: "F",
        pass: false,
        notes: `Error: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  } finally {
    await browser.close();
  }

  console.log("\n=== Schedule QA Results ===\n");
  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"} [${r.id}] ${r.notes}`);
  }
  const allPass = results.every((r) => r.pass);
  console.log(`\nOverall: ${allPass ? "PASS" : "FAIL"}`);
  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
