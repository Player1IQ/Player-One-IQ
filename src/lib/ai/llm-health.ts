import { unstable_cache } from "next/cache";
import { resolveLlmConfig } from "./credentials";
import { isAiLlmConfigured } from "./config";
import { isRecoverableLlmError } from "./llm-errors";
import { probeLlmConfig } from "./llm";
import type { AiLlmSource } from "./providers/types";

export type AiLlmHealth =
  | "unconfigured"
  | "available"
  | "quota_exceeded"
  | "unavailable";

export interface AiLlmHealthState {
  health: AiLlmHealth;
  source: AiLlmSource | null;
  provider: string | null;
}

async function probeResolvedConfig(
  organizationId: string
): Promise<AiLlmHealthState> {
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

    if (/insufficient_quota/i.test(probe.error)) {
      return {
        health: "quota_exceeded",
        source: config.source,
        provider: config.provider,
      };
    }
    if (isRecoverableLlmError(probe.error)) {
      return {
        health: "unavailable",
        source: config.source,
        provider: config.provider,
      };
    }
    return {
      health: "unavailable",
      source: config.source,
      provider: config.provider,
    };
  } catch (error) {
    if (isRecoverableLlmError(error)) {
      return {
        health: "unavailable",
        source: config.source,
        provider: config.provider,
      };
    }
    return {
      health: "unavailable",
      source: config.source,
      provider: config.provider,
    };
  }
}

const getCachedAiLlmHealth = unstable_cache(
  async (organizationId: string) => probeResolvedConfig(organizationId),
  ["ai-llm-health-probe"],
  { revalidate: 300 }
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
