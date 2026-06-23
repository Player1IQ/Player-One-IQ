import { test, expect } from "@playwright/test";

const protectedRoutes = ["/portal", "/contracts", "/team"] as const;

for (const route of protectedRoutes) {
  test(`unauthenticated visit to ${route} redirects to login`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login/);

    const url = new URL(page.url());
    expect(url.searchParams.get("redirect")).toBe(route);
  });
}
