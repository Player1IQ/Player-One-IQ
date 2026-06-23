import { test, expect } from "@playwright/test";

const portalEmail = process.env.E2E_PORTAL_EMAIL;
const portalPassword = process.env.E2E_PORTAL_PASSWORD;
const staffEmail = process.env.E2E_STAFF_EMAIL;
const staffPassword = process.env.E2E_STAFF_PASSWORD;

async function login(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
  redirect?: string
) {
  const loginPath = redirect
    ? `/login?redirect=${encodeURIComponent(redirect)}`
    : "/login";
  await page.goto(loginPath);
  await page.getByLabel("Email address").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test.describe("authenticated portal user", () => {
  test.beforeEach(() => {
    test.skip(!portalEmail || !portalPassword, "E2E_PORTAL_EMAIL/PASSWORD not set");
  });

  test("blocked staff route redirects to portal", async ({ page }) => {
    await login(page, portalEmail!, portalPassword!, "/team");
    await expect(page).toHaveURL(/\/portal/);
  });

  test("portal home is reachable after login", async ({ page }) => {
    await login(page, portalEmail!, portalPassword!, "/portal");
    await expect(page).toHaveURL(/\/portal/);
  });
});

test.describe("authenticated staff user", () => {
  test.beforeEach(() => {
    test.skip(!staffEmail || !staffPassword, "E2E_STAFF_EMAIL/PASSWORD not set");
  });

  test("staff dashboard root is reachable after login", async ({ page }) => {
    await login(page, staffEmail!, staffPassword!, "/");
    await expect(page).toHaveURL(/\/($|\?)/);
  });

  test("portal path is allowed for staff", async ({ page }) => {
    await login(page, staffEmail!, staffPassword!, "/portal");
    await expect(page).toHaveURL(/\/portal/);
  });
});
