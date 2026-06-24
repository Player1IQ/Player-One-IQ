export const WEBHOOK_EVENTS = [
  "application.created",
  "contract.updated",
  "deliverable.completed",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export const WEBHOOK_EVENT_LABELS: Record<WebhookEvent, string> = {
  "application.created": "Application created",
  "contract.updated": "Contract updated",
  "deliverable.completed": "Deliverable completed",
};

export function isWebhookEvent(value: string): value is WebhookEvent {
  return (WEBHOOK_EVENTS as readonly string[]).includes(value);
}
