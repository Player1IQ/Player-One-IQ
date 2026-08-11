import { isAiFeatureEnabled } from "@/lib/ai/config";
import { canRunLiveAi, resolveLlmConfig } from "@/lib/ai/credentials";
import { getLlmFallbackNotice } from "@/lib/ai/llm-errors";
import { runLlmJsonCompletion } from "@/lib/ai/llm";
import { getOrganizationId } from "@/lib/organization/queries";
import { generateCreatorAiDemoPlan } from "./plan-demo";
import {
  buildCreatorAiPlanUserPrompt,
  CREATOR_AI_PLAN_SYSTEM_PROMPT,
} from "./plan-prompts";
import {
  computePlanPeriod,
  parseContentPlanFromLlmResponse,
  type ContentPlanPayload,
} from "./plan-types";
import type { CreatorAiContext } from "./types";

export type CreatorAiPlanMode = "live" | "demo";

export interface CreatorAiPlanGenerationResult {
  plan: ContentPlanPayload;
  mode: CreatorAiPlanMode;
  tokensUsed: number;
  model: string | null;
  fallbackNotice?: string;
  periodStart: string;
  periodEnd: string;
}

export async function runCreatorAiPlanGeneration(input: {
  context: CreatorAiContext;
  contextJson: string;
  weeksAhead?: number;
}): Promise<CreatorAiPlanGenerationResult> {
  const weeksAhead = input.weeksAhead ?? 2;
  const period = computePlanPeriod(weeksAhead);

  if (!isAiFeatureEnabled()) {
    return {
      plan: generateCreatorAiDemoPlan(input.context, period.weekStarts.length),
      mode: "demo",
      tokensUsed: 0,
      model: null,
      ...period,
    };
  }

  const organizationId = await getOrganizationId();
  if (!organizationId || !(await canRunLiveAi(organizationId))) {
    return {
      plan: generateCreatorAiDemoPlan(input.context, period.weekStarts.length),
      mode: "demo",
      tokensUsed: 0,
      model: null,
      ...period,
    };
  }

  let llmSource: "org" | "platform" | undefined;

  try {
    const llmConfig = await resolveLlmConfig(organizationId);
    if (!llmConfig) {
      return {
        plan: generateCreatorAiDemoPlan(input.context, period.weekStarts.length),
        mode: "demo",
        tokensUsed: 0,
        model: null,
        ...period,
      };
    }

    llmSource = llmConfig.source;

    const llm = await runLlmJsonCompletion(
      {
        system: CREATOR_AI_PLAN_SYSTEM_PROMPT,
        user: buildCreatorAiPlanUserPrompt({
          contextJson: input.contextJson,
          weeksAhead: period.weekStarts.length,
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
          weekStarts: period.weekStarts,
        }),
      },
      llmConfig
    );

    const plan = parseContentPlanFromLlmResponse(llm.content);

    return {
      plan,
      mode: "live",
      tokensUsed: llm.tokensUsed,
      model: llm.model,
      ...period,
    };
  } catch (error) {
    console.error("Creator AI plan generation failed, falling back to demo:", error);
    return {
      plan: generateCreatorAiDemoPlan(input.context, period.weekStarts.length),
      mode: "demo",
      tokensUsed: 0,
      model: null,
      fallbackNotice: getLlmFallbackNotice(error, llmSource),
      ...period,
    };
  }
}
