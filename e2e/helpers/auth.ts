import type { Page } from "@playwright/test";

export async function dismissModals(page: Page) {
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

export async function login(
  page: Page,
  email: string,
  password: string,
  redirect = "/schedule"
) {
  const loginPath = redirect
    ? `/login?redirect=${encodeURIComponent(redirect)}`
    : "/login";
  await page.goto(loginPath);
  await page.waitForLoadState("domcontentloaded");
  await page.getByLabel("Email address").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  try {
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
      timeout: 30_000,
    });
  } catch {
    const loginError = page.locator("form .text-red-400");
    const message = (await loginError.textContent().catch(() => null))?.trim();
    throw new Error(message || `Login did not leave /login for ${email}`);
  }

  if (
    redirect &&
    page.url().pathname !== redirect &&
    !page.url().pathname.startsWith(`${redirect}/`)
  ) {
    await page.goto(redirect);
    await page.waitForLoadState("networkidle");
  }

  await dismissModals(page);
}
