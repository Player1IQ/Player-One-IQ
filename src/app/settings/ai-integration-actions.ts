"use server";

import { revalidatePath } from "next/cache";
import { revalidateAiLlmHealth } from "@/lib/ai/llm-health";
import { requireSettingsManageAccess } from "@/lib/permissions";
import {
  getAiIntegrationForSettings,
  getOrganizationLlmConfigResult,
  removeOrganizationAiIntegration,
  resolveLlmConfig,
  saveOrganizationAiIntegration,
  updateOrganizationAiProbeStatus,
} from "@/lib/ai/credentials";
import { getOrganizationId } from "@/lib/organization/queries";
import { probeLlmConfig } from "@/lib/ai/llm";
import type { AiProvider } from "@/lib/ai/providers/types";
import { aiProviderOptions } from "@/lib/ai/providers/types";

export async function getAiIntegrationSettings() {
  const permError = await requireSettingsManageAccess();
  if (permError) return permError;

  const integration = await getAiIntegrationForSettings();
  return {
    integration,
    encryptionConfigured: Boolean(
      process.env.AI_CREDENTIALS_ENCRYPTION_KEY?.trim()
    ),
    platformFallbackConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
  };
}

export async function saveAiIntegrationSettings(input: {
  provider: AiProvider;
  apiKey?: string;
  model?: string;
  isEnabled: boolean;
}) {
  const permError = await requireSettingsManageAccess();
  if (permError) return permError;

  if (!aiProviderOptions.some((option) => option.value === input.provider)) {
    return { error: "Invalid AI provider." };
  }

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const result = await saveOrganizationAiIntegration(input);
  if (result.error) return { error: result.error };

  const config = await resolveLlmConfig(organizationId);
  if (config?.source === "org") {
    const probe = await probeLlmConfig(config);
    await updateOrganizationAiProbeStatus(
      organizationId,
      probe.ok ? { ok: true } : { ok: false, error: probe.error }
    );
  }

  revalidatePath("/settings");
  revalidatePath("/ai");
  revalidateAiLlmHealth();
  return { success: true };
}

export async function disconnectAiIntegration() {
  const permError = await requireSettingsManageAccess();
  if (permError) return permError;

  const result = await removeOrganizationAiIntegration();
  if (result.error) return { error: result.error };

  revalidatePath("/settings");
  revalidatePath("/ai");
  revalidateAiLlmHealth();
  return { success: true };
}

export async function testAiIntegrationConnection(input?: {
  provider?: AiProvider;
  apiKey?: string;
  model?: string;
}) {
  const permError = await requireSettingsManageAccess();
  if (permError) return permError;

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  let config = await resolveLlmConfig(organizationId);

  if (!input?.apiKey?.trim()) {
    const orgResult = await getOrganizationLlmConfigResult(organizationId);
    if (orgResult.status === "decrypt_failed") {
      return {
        error:
          "Your saved API key could not be decrypted. Paste the key again and save, or verify AI_CREDENTIALS_ENCRYPTION_KEY matches the value used when the key was saved.",
      };
    }
  }

  if (input?.apiKey?.trim()) {
    const provider = input.provider ?? config?.provider ?? "openai";
    const model =
      input.model?.trim() ||
      config?.model ||
      aiProviderOptions.find((option) => option.value === provider)?.defaultModel ||
      "gpt-4o-mini";

    config = {
      source: "org",
      provider,
      apiKey: input.apiKey.trim(),
      model,
    };
  }

  if (!config) {
    return {
      error:
        "No AI provider configured. Add an API key or enable platform fallback.",
    };
  }

  const probe = await probeLlmConfig(config);
  if (config.source === "org") {
    await updateOrganizationAiProbeStatus(
      organizationId,
      probe.ok ? { ok: true } : { ok: false, error: probe.error }
    );
  }

  if (!probe.ok) {
    revalidatePath("/settings");
    revalidatePath("/ai");
    revalidateAiLlmHealth();
    return { error: probe.error };
  }

  revalidateAiLlmHealth();
  revalidatePath("/ai");
  revalidatePath("/settings");

  return {
    success: true,
    provider: config.provider,
    model: config.model,
    source: config.source,
  };
}
