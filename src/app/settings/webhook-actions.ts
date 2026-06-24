"use server";

import { revalidatePath } from "next/cache";
import {
  createOrganizationWebhook,
  deleteOrganizationWebhook,
  getOrganizationWebhooksForSettings,
  setOrganizationWebhookActive,
  type OrganizationWebhookSummary,
} from "@/lib/api/webhook-management";

export async function listWebhooksAction(): Promise<{
  error?: string;
  webhooks?: OrganizationWebhookSummary[];
}> {
  const webhooks = await getOrganizationWebhooksForSettings();
  return { webhooks };
}

export async function createWebhookAction(input: {
  label: string;
  url: string;
  events: string[];
}): Promise<{
  error?: string;
  webhook?: OrganizationWebhookSummary;
  secret?: string;
}> {
  const result = await createOrganizationWebhook(input);
  if (result.error) return { error: result.error };

  revalidatePath("/settings");
  return {
    webhook: result.webhook,
    secret: result.secret,
  };
}

export async function setWebhookActiveAction(
  webhookId: string,
  active: boolean
): Promise<{ error?: string }> {
  const result = await setOrganizationWebhookActive(webhookId, active);
  if (result.error) return { error: result.error };

  revalidatePath("/settings");
  return {};
}

export async function deleteWebhookAction(
  webhookId: string
): Promise<{ error?: string }> {
  const result = await deleteOrganizationWebhook(webhookId);
  if (result.error) return { error: result.error };

  revalidatePath("/settings");
  return {};
}
