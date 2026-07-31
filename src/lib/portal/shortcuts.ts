/** Short portal paths that redirect to canonical /portal/* routes. */
export const PORTAL_ROUTE_SHORTCUTS: Record<string, string> = {
  "/coach": "/portal/coach",
  "/deliverables": "/portal/deliverables",
  "/growth": "/portal/growth",
  "/seasons": "/portal/seasons",
  "/messages": "/portal/messages",
};

export const PORTAL_SHORTCUT_PATHS = Object.keys(PORTAL_ROUTE_SHORTCUTS);

export function resolvePortalShortcut(pathname: string): string | null {
  return PORTAL_ROUTE_SHORTCUTS[pathname] ?? null;
}
