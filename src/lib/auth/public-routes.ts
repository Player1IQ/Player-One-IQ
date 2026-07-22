import { MARKETING_HOME_PATH } from "@/lib/routes";

const PUBLIC_PREFIX_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/auth/callback",
  "/terms",
  "/privacy",
  "/welcome",
  "/invite",
];

const MIDDLEWARE_PUBLIC_PREFIX_ROUTES = [
  ...PUBLIC_PREFIX_ROUTES,
  "/api/billing/webhook",
  "/api/health",
  "/api/v1",
];

export function isPublicAppPath(pathname: string): boolean {
  if (pathname === MARKETING_HOME_PATH) return true;
  return PUBLIC_PREFIX_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function isPublicMiddlewarePath(pathname: string): boolean {
  if (pathname === MARKETING_HOME_PATH) return true;
  return MIDDLEWARE_PUBLIC_PREFIX_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}
