import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import { requireFeatureAccess, requireSettingsManageAccess } from "@/lib/permissions";
import {
  generateWebhookSecret,
  isValidWebhookUrl,
} from "@/lib/api/webhook-crypto";
import { isWebhookEvent, type WebhookEvent } from "@/lib/api/webhook-events";

export interface OrganizationWebhookSummary {
  id: string;
  label: string;
  url: string;
  events: WebhookEvent[];
  active: boolean;
  createdAt: string;
  lastTriggeredAt: string | null;
  lastError: string | null;
}

interface OrganizationWebhookRow {
  id: string;
  organization_id: string;
  label: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  created_at: string;
  last_triggered_at: string | null;
  last_error: string | null;
}

const webhookListSelect =
  "id, organization_id, label, url, events, active, created_at, last_triggered_at, last_error";

function mapWebhookRow(row: OrganizationWebhookRow): OrganizationWebhookSummary {
  return {
    id: row.id,
    label: row.label,
    url: row.url,
    events: row.events.filter(isWebhookEvent),
    active: row.active,
    createdAt: row.created_at,
    lastTriggeredAt: row.last_triggered_at,
    lastError: row.last_error,
  };
}

function validateEvents(events: string[]): WebhookEvent[] | { error: string } {
  if (events.length === 0) {
    return { error: "Select at least one event." };
  }

  const invalid = events.find((event) => !isWebhookEvent(event));
  if (invalid) return { error: `Invalid event: ${invalid}` };

  return events as WebhookEvent[];
}

export async function listOrganizationWebhooks(): Promise<
  OrganizationWebhookSummary[]
> {
  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("organization_webhooks")
    .select(webhookListSelect)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as OrganizationWebhookRow[]).map(mapWebhookRow);
}

export async function createOrganizationWebhook(input: {
  label: string;
  url: string;
  events: string[];
}): Promise<{
  error?: string;
  webhook?: OrganizationWebhookSummary;
  secret?: string;
}> {
  const permError = await requireSettingsManageAccess();
  if (permError) return permError;

  const featureError = await requireFeatureAccess("api_access", "API access");
  if (featureError) return featureError;

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const label = input.label.trim();
  if (!label) return { error: "Label is required." };

  const url = input.url.trim();
  if (!url) return { error: "URL is required." };
  if (!isValidWebhookUrl(url)) {
    return {
      error:
        process.env.NODE_ENV === "production"
          ? "Webhook URL must use HTTPS."
          : "Webhook URL must use HTTPS, or http://localhost in development.",
    };
  }

  const eventsResult = validateEvents(input.events);
  if ("error" in eventsResult) return eventsResult;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const secret = generateWebhookSecret();

  const { data, error } = await supabase
    .from("organization_webhooks")
    .insert({
      organization_id: organizationId,
      label,
      url,
      secret,
      events: eventsResult,
    })
    .select(webhookListSelect)
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create webhook endpoint." };
  }

  return {
    webhook: mapWebhookRow(data as OrganizationWebhookRow),
    secret,
  };
}

export async function setOrganizationWebhookActive(
  webhookId: string,
  active: boolean
): Promise<{ error?: string }> {
  const permError = await requireSettingsManageAccess();
  if (permError) return permError;

  const featureError = await requireFeatureAccess("api_access", "API access");
  if (featureError) return featureError;

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const { data: existing } = await supabase
    .from("organization_webhooks")
    .select("id")
    .eq("id", webhookId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!existing) return { error: "Webhook endpoint not found." };

  const { error } = await supabase
    .from("organization_webhooks")
    .update({ active })
    .eq("id", webhookId)
    .eq("organization_id", organizationId);

  if (error) return { error: error.message };
  return {};
}

export async function deleteOrganizationWebhook(
  webhookId: string
): Promise<{ error?: string }> {
  const permError = await requireSettingsManageAccess();
  if (permError) return permError;

  const featureError = await requireFeatureAccess("api_access", "API access");
  if (featureError) return featureError;

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const { data: existing } = await supabase
    .from("organization_webhooks")
    .select("id")
    .eq("id", webhookId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!existing) return { error: "Webhook endpoint not found." };

  const { error } = await supabase
    .from("organization_webhooks")
    .delete()
    .eq("id", webhookId)
    .eq("organization_id", organizationId);

  if (error) return { error: error.message };
  return {};
}

export async function getOrganizationWebhooksForSettings(): Promise<
  OrganizationWebhookSummary[]
> {
  const permError = await requireSettingsManageAccess();
  if (permError) return [];

  const featureError = await requireFeatureAccess("api_access", "API access");
  if (featureError) return [];

  return listOrganizationWebhooks();
}
