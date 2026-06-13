import { generateAssistantResult, getAssistantForAction } from "./assistants";
import {
  buildAiWorkspaceContext,
  summarizeContextForPrompt,
} from "./context";
import { isAiLlmLive } from "./config";
import { getLlmFallbackNotice } from "./llm-errors";
import { runOpenAiAssistant } from "./llm";
import { buildAiPrompt } from "./prompts";
import type { AiActionType, AiAssistantResult } from "./types";

export type AiRunMode = "live" | "demo";

export interface AiRunOutput {
  result: AiAssistantResult;
  mode: AiRunMode;
  tokensUsed: number;
  model: string | null;
  fallbackNotice?: string;
}

export async function runAssistantAction(
  action: AiActionType,
  context?: { creatorName?: string; sponsorName?: string }
): Promise<AiRunOutput> {
  const assistantType = getAssistantForAction(action);

  if (!isAiLlmLive()) {
    return {
      result: generateAssistantResult(action, context),
      mode: "demo",
      tokensUsed: 0,
      model: null,
    };
  }

  try {
    const workspace = await buildAiWorkspaceContext();
    const contextJson = summarizeContextForPrompt(workspace);
    const prompt = buildAiPrompt(action, contextJson);
    const llm = await runOpenAiAssistant({
      system: prompt.system,
      user: prompt.user,
      assistantType,
    });

    return {
      result: llm.result,
      mode: "live",
      tokensUsed: llm.tokensUsed,
      model: llm.model,
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
