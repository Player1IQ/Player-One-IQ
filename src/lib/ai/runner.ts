import { generateAssistantResult, getAssistantForAction } from "./assistants";
import {
  buildAiWorkspaceContext,
  summarizeContextForPrompt,
} from "./context";
import { isAiFeatureEnabled } from "./config";
import { canRunLiveAi, resolveLlmConfig } from "./credentials";
import { getOrganizationId } from "@/lib/organization/queries";
import { getLlmFallbackNotice } from "./llm-errors";
import { runLlmAssistant } from "./llm";
import { buildAiPrompt } from "./prompts";
import type { AiActionType, AiAssistantResult } from "./types";
import type { AiAssistantType } from "@/lib/subscription/types";

export type AiRunMode = "live" | "demo";

export interface AiRunOutput {
  result: AiAssistantResult;
  mode: AiRunMode;
  tokensUsed: number;
  model: string | null;
  fallbackNotice?: string;
  source?: "org" | "platform";
}

export async function executeLiveAiPrompt(params: {
  system: string;
  user: string;
  assistantType: AiAssistantType;
}): Promise<
  | { ok: false }
  | {
      ok: true;
      result: AiAssistantResult;
      tokensUsed: number;
      model: string;
      source: "org" | "platform";
    }
> {
  if (!isAiFeatureEnabled()) return { ok: false };

  const organizationId = await getOrganizationId();
  if (!organizationId || !(await canRunLiveAi(organizationId))) {
    return { ok: false };
  }

  const llmConfig = await resolveLlmConfig(organizationId);
  if (!llmConfig) return { ok: false };

  const llm = await runLlmAssistant(
    {
      system: params.system,
      user: params.user,
      assistantType: params.assistantType,
    },
    llmConfig
  );

  return {
    ok: true,
    result: llm.result,
    tokensUsed: llm.tokensUsed,
    model: llm.model,
    source: llmConfig.source,
  };
}

export async function runAssistantAction(
  action: AiActionType,
  context?: { creatorName?: string; sponsorName?: string }
): Promise<AiRunOutput> {
  const assistantType = getAssistantForAction(action);

  if (!isAiFeatureEnabled()) {
    return {
      result: generateAssistantResult(action, context),
      mode: "demo",
      tokensUsed: 0,
      model: null,
    };
  }

  const organizationId = await getOrganizationId();
  if (!organizationId || !(await canRunLiveAi(organizationId))) {
    return {
      result: generateAssistantResult(action, context),
      mode: "demo",
      tokensUsed: 0,
      model: null,
    };
  }

  try {
    const llmConfig = await resolveLlmConfig(organizationId);
    if (!llmConfig) {
      return {
        result: generateAssistantResult(action, context),
        mode: "demo",
        tokensUsed: 0,
        model: null,
      };
    }

    const workspace = await buildAiWorkspaceContext();
    const contextJson = summarizeContextForPrompt(workspace);
    const prompt = buildAiPrompt(action, contextJson);
    const llm = await runLlmAssistant(
      {
        system: prompt.system,
        user: prompt.user,
        assistantType,
      },
      llmConfig
    );

    return {
      result: llm.result,
      mode: "live",
      tokensUsed: llm.tokensUsed,
      model: llm.model,
      source: llmConfig.source,
    };
  } catch (error) {
    console.error("AI live run failed, falling back to demo:", error);
    return {
      result: generateAssistantResult(action, context),
      mode: "demo",
      tokensUsed: 0,
      model: null,
      fallbackNotice: getLlmFallbackNotice(error),
    };
  }
}
