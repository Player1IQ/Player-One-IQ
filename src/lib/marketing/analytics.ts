export type FoundingAnalyticsEvent =
  | "founding_page_view"
  | "founding_apply_clicked"
  | "founding_application_started"
  | "founding_application_submitted"
  | "founding_creator_application"
  | "founding_organization_application";

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

/** Lightweight marketing analytics hook — extend when a vendor is added. */
export function trackMarketingEvent(
  event: FoundingAnalyticsEvent,
  payload?: AnalyticsPayload
): void {
  if (typeof window === "undefined") return;

  const detail = { event, ...payload, ts: Date.now() };

  window.dispatchEvent(new CustomEvent("p1iq:analytics", { detail }));

  if (process.env.NODE_ENV === "development") {
    console.info("[analytics]", detail);
  }
}
