import { after } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import type { WebhookEvent } from "./webhook-events";
import { signWebhookPayload } from "./webhook-crypto";

const DELIVERY_TIMEOUT_MS = 10_000;

export interface WebhookEnvelope {
  event: WebhookEvent;
  created_at: string;
  organization_id: string;
  data: Record<string, unknown>;
}

interface OrganizationWebhookRow {
  id: string;
  organization_id: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
}

async function deliverToEndpoint(
  endpoint: OrganizationWebhookRow,
  envelope: WebhookEnvelope
): Promise<{ ok: true } | { ok: false; error: string }> {
  const body = JSON.stringify(envelope);
  const signature = signWebhookPayload(endpoint.secret, body);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "PlayerOneIQ-Webhooks/1.0",
        "X-POIQ-Signature": signature,
        "X-POIQ-Event": envelope.event,
      },
      body,
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `HTTP ${response.status} ${response.statusText}`.trim(),
      };
    }

    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.name === "AbortError"
          ? "Delivery timed out after 10s"
          : err.message
        : "Delivery failed";
    return { ok: false, error: message };
  } finally {
    clearTimeout(timeout);
  }
}

async function updateEndpointDeliveryState(
  endpointId: string,
  result: { ok: true } | { ok: false; error: string }
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  const now = new Date().toISOString();
  if (result.ok) {
    await supabase
      .from("organization_webhooks")
      .update({ last_triggered_at: now, last_error: null })
      .eq("id", endpointId);
    return;
  }

  await supabase
    .from("organization_webhooks")
    .update({ last_triggered_at: now, last_error: result.error.slice(0, 500) })
    .eq("id", endpointId);
}

export async function deliverOrganizationWebhook(
  organizationId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  const { data: endpoints, error } = await supabase
    .from("organization_webhooks")
    .select("id, organization_id, url, secret, events, active")
    .eq("organization_id", organizationId)
    .eq("active", true);

  if (error || !endpoints?.length) return;

  const envelope: WebhookEnvelope = {
    event,
    created_at: new Date().toISOString(),
    organization_id: organizationId,
    data,
  };

  const matching = (endpoints as OrganizationWebhookRow[]).filter((endpoint) =>
    endpoint.events.includes(event)
  );

  await Promise.allSettled(
    matching.map(async (endpoint) => {
      const result = await deliverToEndpoint(endpoint, envelope);
      await updateEndpointDeliveryState(endpoint.id, result);
    })
  );
}

export function dispatchOrganizationWebhook(
  organizationId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): void {
  after(() => deliverOrganizationWebhook(organizationId, event, data));
}
