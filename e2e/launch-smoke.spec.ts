import { test, expect, type Page } from "@playwright/test";
import { dismissModals } from "./helpers/auth";

const PASSWORD = "LaunchTest9!";

function uniqueEmail(kind: "creator" | "agency"): string {
  return `poiq.e2e.${kind}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function assertPageHasContent(page: Page) {
  await expect(page.locator("body")).not.toBeEmpty();
  const text = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
  expect(text.length, `blank page at ${page.url()}`).toBeGreaterThan(40);
}

async function assertNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
  );
  expect(overflow, `horizontal scroll at ${page.url()}`).toBe(false);
}

async function fillSignup(page: Page, email: string) {
  await page.getByLabel(/email/i).first().fill(email);
  await page.getByLabel(/^password$/i).fill(PASSWORD);
  await page.getByLabel(/confirm password/i).fill(PASSWORD);
  await page.getByRole("button", { name: /create account/i }).click();
}

async function signOut(page: Page) {
  const signOut = page.getByRole("button", { name: /sign out/i }).first();
  if (!(await signOut.isVisible().catch(() => false))) {
    const openMenu = page.getByRole("button", { name: /open menu/i });
    if (await openMenu.isVisible().catch(() => false)) {
      await openMenu.click();
    }
  }
  await page.getByRole("button", { name: /sign out/i }).first().click();
  await page.waitForURL(/\/login/, { timeout: 20_000 });
}

test.describe("launch smoke", () => {
  test.describe.configure({ timeout: 120_000 });

  test("creator signup to snapshot to plan to sign out", async ({ page }) => {
    const email = uniqueEmail("creator");
    await page.goto("/signup?account=creator");
    await fillSignup(page, email);

    await page.waitForURL(
      (url) =>
        url.pathname.startsWith("/portal") ||
        url.pathname.startsWith("/organization-setup") ||
        url.pathname.startsWith("/onboarding"),
      { timeout: 60_000 }
    );

    if (new URL(page.url()).pathname.startsWith("/organization-setup")) {
      const name = page.getByLabel(/creator \/ player name/i);
      if (await name.isVisible().catch(() => false)) {
        await name.fill("E2E Creator");
        await page.getByRole("button", { name: /enter creator portal/i }).click();
      }
    }

    if (new URL(page.url()).pathname.startsWith("/onboarding")) {
      const skip = page.getByRole("button", { name: /skip for now/i });
      if (await skip.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await skip.click();
      }
    }

    await page.waitForURL(/\/portal/, { timeout: 45_000 });
    await dismissModals(page);
    await assertPageHasContent(page);

    await page.goto("/portal/snapshot");
    await dismissModals(page);
    await expect(page.getByRole("heading", { level: 1 }).or(page.locator("h1, h2").first())).toBeVisible();
    await assertPageHasContent(page);

    const connect = page.getByRole("link", { name: /connect (twitch|youtube)/i }).first();
    if (await connect.isVisible().catch(() => false)) {
      await expect(connect).toHaveAttribute("href", /platform-oauth/);
    }

    await page.goto("/portal/coach");
    await dismissModals(page);
    await assertPageHasContent(page);

    await signOut(page);
    await expect(page).toHaveURL(/\/login/);
  });

  test("agency signup to org setup to onboarding to dashboard to AI", async ({
    page,
  }) => {
    const email = uniqueEmail("agency");
    await page.goto("/signup?account=agency");
    await fillSignup(page, email);

    await page.waitForURL(/\/organization-setup/, { timeout: 60_000 });
    await page.getByLabel(/organization name/i).fill("E2E Agency");
    await page.getByRole("button", { name: /complete setup/i }).click();

    await page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 45_000 });
    if (new URL(page.url()).pathname.startsWith("/onboarding")) {
      await assertPageHasContent(page);
      const continueBtn = page.getByRole("button", { name: /continue|go to dashboard/i });
      await continueBtn.click();
      const finish = page.getByRole("button", { name: /go to dashboard/i });
      if (await finish.isVisible({ timeout: 8_000 }).catch(() => false)) {
        await finish.click();
      }
    }

    await page.waitForURL(/\/dashboard/, { timeout: 45_000 });
    await dismissModals(page);
    await assertPageHasContent(page);

    await page.goto("/ai");
    await dismissModals(page);
    await assertPageHasContent(page);
    await expect(page).not.toHaveURL(/twitch\.tv|google\.com|youtube\.com/);
  });
});

test.describe("mobile 390", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test.describe.configure({ timeout: 90_000 });

  test("landing, signup, and public pages do not overflow", async ({ page }) => {
    for (const path of ["/", "/signup", "/signup?account=creator", "/founding", "/login"]) {
      await page.goto(path);
      await page.waitForLoadState("domcontentloaded");
      await assertPageHasContent(page);
      await assertNoHorizontalScroll(page);
    }

    const menu = page.getByRole("button", { name: /open menu/i });
    await page.goto("/");
    if (await menu.isVisible().catch(() => false)) {
      await menu.click();
      await expect(page.getByRole("link", { name: /sign in/i }).first()).toBeVisible();
    }
  });
});
