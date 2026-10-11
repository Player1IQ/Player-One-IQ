/**
 * Full document navigation. Use this after auth, onboarding, and other
 * server-redirect hops — Next.js client `router.push()` + `router.refresh()`
 * can commit the new URL while the RSC payload stays empty (`<!--$--><!--/$-->`).
 */
export function hardNavigate(href: string): void {
  if (typeof window === "undefined") return;
  window.location.assign(href);
}
