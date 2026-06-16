import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getOrganizationId } from "@/lib/organization/queries";
import { getOpenAiModel, isAiLlmConfigured } from "./config";
import {
  decryptApiKey,
  encryptApiKey,
  isAiCredentialsEncryptionConfigured,
} from "./credentials-crypto";
import type {
  AiIntegrationPublic,
  AiProvider,
  ResolvedLlmConfig,
} from "./providers/types";
import { apiKeyHint, getDefaultModelForProvider } from "./providers/types";

interface OrganizationAiIntegrationRow {
  organization_id: string;
  provider: AiProvider;
  encrypted_api_key: string;
  api_key_hint: string;
  model: string | null;
  is_enabled: boolean;
  updated_at: string;
}

export async function getAiIntegrationForSettings(): Promise<AiIntegrationPublic | null> {
  return getAiIntegrationPublicSummary();
}

export async function getAiIntegrationPublicSummary(): Promise<AiIntegrationPublic | null> {
  const organizationId = await getOrganizationId();
  if (!organizationId) return null;

  const supabase = createServiceClient() ?? (await createClient());
  if (!supabase) return null;

  const { data } = await supabase
    .from("organization_ai_integrations")
    .select("provider, api_key_hint, model, is_enabled, updated_at")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!data) return null;

  return {
    provider: data.provider as AiProvider,
    apiKeyHint: data.api_key_hint,
    model: data.model,
    isEnabled: data.is_enabled,
    hasApiKey: Boolean(data.api_key_hint),
    updatedAt: data.updated_at,
  };
}

export async function getOrganizationLlmConfig(
  organizationId: string
): Promise<ResolvedLlmConfig | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("organization_ai_integrations")
    .select("provider, encrypted_api_key, model, is_enabled")
    .eq("organization_id", organizationId)
    .maybeSingle<Pick<
      OrganizationAiIntegrationRow,
      "provider" | "encrypted_api_key" | "model" | "is_enabled"
    >>();

  if (!data?.is_enabled) return null;

  try {
    const apiKey = decryptApiKey(data.encrypted_api_key).trim();
    if (!apiKey) return null;

    const provider = data.provider as AiProvider;
    return {
      source: "org",
      provider,
      apiKey,
      model: data.model?.trim() || getDefaultModelForProvider(provider),
    };
  } catch (error) {
    console.error("Failed to decrypt organization AI credentials:", error);
    return null;
  }
}

export async function resolveLlmConfig(
  organizationId: string
): Promise<ResolvedLlmConfig | null> {
  const orgConfig = await getOrganizationLlmConfig(organizationId);
  if (orgConfig) return orgConfig;

  if (!isAiLlmConfigured()) return null;

  return {
    source: "platform",
    provider: "openai",
    apiKey: process.env.OPENAI_API_KEY!.trim(),
    model: getOpenAiModel(),
  };
}

export async function canRunLiveAi(organizationId: string): Promise<boolean> {
  const config = await resolveLlmConfig(organizationId);
  return Boolean(config?.apiKey);
}

export async function saveOrganizationAiIntegration(input: {
  provider: AiProvider;
  apiKey?: string;
  model?: string;
  isEnabled: boolean;
}): Promise<{ error?: string }> {
  if (!isAiCredentialsEncryptionConfigured()) {
    return {
      error:
        "AI credential encryption is not configured. Add AI_CREDENTIALS_ENCRYPTION_KEY to your environment.",
    };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const trimmedKey = input.apiKey?.trim() ?? "";
  const model = input.model?.trim() || null;

  const { data: existing } = await supabase
    .from("organization_ai_integrations")
    .select("encrypted_api_key, api_key_hint")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!trimmedKey && !existing) {
    return { error: "API key is required for a new AI integration." };
  }

  let encryptedApiKey = existing?.encrypted_api_key;
  let hint = existing?.api_key_hint ?? "";

  if (trimmedKey) {
    try {
      encryptedApiKey = encryptApiKey(trimmedKey);
      hint = apiKeyHint(trimmedKey);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to encrypt API key.";
      return { error: message };
    }
  }

  if (!encryptedApiKey) {
    return { error: "API key is required." };
  }

  const { error } = await supabase.from("organization_ai_integrations").upsert(
    {
      organization_id: organizationId,
      provider: input.provider,
      encrypted_api_key: encryptedApiKey,
      api_key_hint: hint,
      model,
      is_enabled: input.isEnabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organization_id" }
  );

  if (error) return { error: error.message };
  return {};
}

export async function removeOrganizationAiIntegration(): Promise<{
  error?: string;
}> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { error } = await supabase
    .from("organization_ai_integrations")
    .delete()
    .eq("organization_id", organizationId);

  if (error) return { error: error.message };
  return {};
}
