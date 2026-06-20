import { revalidateTag, unstable_cache } from "next/cache";
import {
  getOrganizationLlmConfigResult,
  resolveLlmConfig,
} from "./credentials";
import { isAiLlmConfigured } from "./config";
import { isRecoverableLlmError } from "./llm-errors";
import { probeLlmConfig } from "./llm";
import type { AiLlmSource } from "./providers/types";

export const AI_LLM_HEALTH_CACHE_TAG = "ai-llm-health";

export type AiLlmHealth =
  | "unconfigured"
  | "available"
  | "quota_exceeded"
  | "unavailable"
  | "credentials_error";

export interface AiLlmHealthState {
  health: AiLlmHealth;
  source: AiLlmSource | null;
  provider: string | null;
  detail?: string;
}

export function revalidateAiLlmHealth() {
  revalidateTag(AI_LLM_HEALTH_CACHE_TAG);
}

async function probeResolvedConfig(
  organizationId: string
): Promise<AiLlmHealthState> {
  const orgResult = await getOrganizationLlmConfigResult(organizationId);
  if (orgResult.status === "decrypt_failed") {
    return {
      health: "credentials_error",
      source: "org",
      provider: null,
      detail:
        "Your saved API key could not be decrypted. Re-enter the key in Settings (the server encryption key may have changed).",
    };
  }

  const config = await resolveLlmConfig(organizationId);
  if (!config) {
    return { health: "unconfigured", source: null, provider: null };
  }

  try {
    const probe = await probeLlmConfig(config);
    if (probe.ok) {
      return {
        health: "available",
        source: config.source,
        provider: config.provider,
      };
    }

    const detail = probe.error;

    if (/insufficient_quota/i.test(probe.error)) {
      return {
        health: "quota_exceeded",
        source: config.source,
        provider: config.provider,
        detail,
      };
    }
    if (isRecoverableLlmError(probe.error)) {
      return {
        health: "unavailable",
        source: config.source,
        provider: config.provider,
        detail,
      };
    }
    return {
      health: "unavailable",
      source: config.source,
      provider: config.provider,
      detail,
    };
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "AI provider probe failed.";
    if (isRecoverableLlmError(error)) {
      return {
        health: "unavailable",
        source: config.source,
        provider: config.provider,
        detail,
      };
    }
    return {
      health: "unavailable",
      source: config.source,
      provider: config.provider,
      detail,
    };
  }
}

const getCachedAiLlmHealth = unstable_cache(
  async (organizationId: string) => probeResolvedConfig(organizationId),
  ["ai-llm-health-probe"],
  { revalidate: 60, tags: [AI_LLM_HEALTH_CACHE_TAG] }
);

export async function getAiLlmHealth(
  organizationId: string | null
): Promise<AiLlmHealthState> {
  if (!organizationId) {
    if (!isAiLlmConfigured()) {
      return { health: "unconfigured", source: null, provider: null };
    }
    return {
      health: "available",
      source: "platform",
      provider: "openai",
    };
  }

  return getCachedAiLlmHealth(organizationId);
}

/** @deprecated Use getAiLlmHealth */
export type OpenAiHealth = AiLlmHealth;

/** @deprecated Use getAiLlmHealth */
export async function getOpenAiHealth(): Promise<OpenAiHealth> {
  const state = await getAiLlmHealth(null);
  return state.health;
}
