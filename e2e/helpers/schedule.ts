import type { Page } from "@playwright/test";

export function tomorrowAt(hour: number, minute = 0): string {
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

export function tomorrowDayNumber(): number {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.getDate();
}

export async function selectTomorrowInWeekView(page: Page) {
  const dayNum = String(tomorrowDayNumber());
  const dayButton = page
    .locator("button")
    .filter({ has: page.locator(`p:text-is("${dayNum}")`) })
    .first();
  await dayButton.click();
}

export async function fillDateTimeRange(
  page: Page,
  startHour: number,
  endHour: number
) {
  await page
    .getByRole("heading", { name: /Block time|New event|Edit event/ })
    .waitFor({ state: "visible", timeout: 15000 });
  const starts = tomorrowAt(startHour);
  const ends = tomorrowAt(endHour);
  const startInput = page.locator('input[type="datetime-local"]').first();
  await startInput.waitFor({ state: "visible", timeout: 15000 });
  await startInput.fill(starts);
  await page.locator('input[type="datetime-local"]').nth(1).fill(ends);
}

export async function saveModalAndWait(page: Page) {
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
