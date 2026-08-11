import { isAiFeatureEnabled } from "@/lib/ai/config";
import { canRunLiveAi, resolveLlmConfig } from "@/lib/ai/credentials";
import { getLlmFallbackNotice } from "@/lib/ai/llm-errors";
import { runLlmTextCompletion } from "@/lib/ai/llm";
import { getOrganizationId } from "@/lib/organization/queries";
import {
  buildCreatorAiUserPrompt,
  CREATOR_AI_SYSTEM_PROMPT,
} from "./prompts";
import {
  buildChatHistoryForLlm,
  generateCreatorAiDemoResponse,
} from "./demo";
import type { CreatorAiContext, CreatorAiMessage } from "./types";

export type CreatorAiChatMode = "live" | "demo";

export interface CreatorAiChatResult {
  content: string;
  mode: CreatorAiChatMode;
  tokensUsed: number;
  model: string | null;
  fallbackNotice?: string;
}

export async function runCreatorAiChat(input: {
  context: CreatorAiContext;
  contextJson: string;
  userMessage: string;
  history: CreatorAiMessage[];
}): Promise<CreatorAiChatResult> {
  if (!isAiFeatureEnabled()) {
    return {
      content: generateCreatorAiDemoResponse(input.userMessage, input.context),
      mode: "demo",
      tokensUsed: 0,
      model: null,
    };
  }

  const organizationId = await getOrganizationId();
  if (!organizationId || !(await canRunLiveAi(organizationId))) {
    return {
      content: generateCreatorAiDemoResponse(input.userMessage, input.context),
      mode: "demo",
      tokensUsed: 0,
      model: null,
    };
  }

  let llmSource: "org" | "platform" | undefined;

  try {
    const llmConfig = await resolveLlmConfig(organizationId);
    if (!llmConfig) {
      return {
        content: generateCreatorAiDemoResponse(input.userMessage, input.context),
        mode: "demo",
        tokensUsed: 0,
        model: null,
      };
    }

    llmSource = llmConfig.source;

    const history = buildChatHistoryForLlm(input.history);
    const llm = await runLlmTextCompletion(
      {
        system: CREATOR_AI_SYSTEM_PROMPT,
        user: buildCreatorAiUserPrompt({
          contextJson: input.contextJson,
          userMessage: input.userMessage,
        }),
        history,
      },
      llmConfig
    );

    return {
      content: llm.content,
      mode: "live",
      tokensUsed: llm.tokensUsed,
      model: llm.model,
    };
  } catch (error) {
    console.error("Creator AI chat failed, falling back to demo:", error);
    return {
      content: generateCreatorAiDemoResponse(input.userMessage, input.context),
      mode: "demo",
      tokensUsed: 0,
      model: null,
      fallbackNotice: getLlmFallbackNotice(error, llmSource),
    };
  }
}
