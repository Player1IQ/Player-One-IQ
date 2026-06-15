"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import {
  requireFeatureAccess,
  requireUsageWithinLimit,
} from "@/lib/permissions";
import { aiFeatureKeys } from "@/lib/subscription/features";
import {
  fetchCreatorContentSnapshots,
  getAnalyzablePlatforms,
} from "@/lib/platform-oauth/content-aggregate";
import type { ContentAnalysisScope } from "@/lib/platform-oauth/content-performance";
import { getConnectedOAuthPlatformsForCreator } from "@/lib/platform-oauth/account-access";
import { getUsageMetricCount, incrementUsageMetric } from "@/lib/subscription/usage";
import {
  generateAssistantResult,
  generateContractSummaryDemo,
  getAssistantForAction,
} from "./assistants";
import { buildContractSummaryContext } from "./contract-context";
import {
  buildAiWorkspaceContext,
  summarizeContextForPrompt,
} from "./context";
import { isAiFeatureEnabled } from "./config";
import { canRunLiveAi } from "./credentials";
import { getLlmFallbackNotice, isRecoverableLlmError } from "./llm-errors";
import { buildContentAnalysisPrompt, buildContractSummaryPrompt, buildQuestionPrompt } from "./prompts";
import { executeLiveAiPrompt, runAssistantAction } from "./runner";
import type { AiActionType, AiAssistantResult } from "./types";
import type { AiAssistantType, FeatureKey } from "@/lib/subscription/types";

const MAX_QUESTION_LENGTH = 2000;

const actionFeatureRequirements: Record<AiActionType, FeatureKey[]> = {
  analyze_performance: ["ai_growth", "ai_creator_performance"],
  growth_recommendations: ["ai_growth", "ai_creator_performance"],
  content_strategy: ["ai_growth", "ai_creator_performance"],
  sponsorship_targets: [
    "ai_sponsorship",
    "ai_sponsorship_matching",
    "ai_deal_recommendations",
  ],
  match_creators: [
    "ai_sponsorship",
    "ai_sponsorship_matching",
    "ai_creator_discovery",
  ],
  match_sponsors: ["ai_sponsorship", "ai_sponsorship_matching"],
  rank_opportunities: [
    "ai_sponsorship",
    "ai_sponsorship_matching",
    "ai_campaign_recommendations",
  ],
  forecast_earnings: ["revenue_forecasting", "ai_forecasting"],
  forecast_campaigns: ["ai_roi_forecasting", "ai_forecasting"],
  predict_contract_value: ["ai_deal_recommendations", "revenue_forecasting"],
};

function routeQuestionAssistantType(question: string): AiAssistantType {
  const q = question.toLowerCase();
  if (
    /\b(sponsor|sponsorship|match|partner|opportunity|brand|campaign)\b/.test(q)
  ) {
    return "sponsorship";
  }
  if (
    /\b(revenue|forecast|earnings|contract|deal|roi|payment)\b/.test(q)
  ) {
    return "revenue";
  }
  return "growth";
}

function generateQuestionDemoResult(
  question: string,
  assistantType: AiAssistantType
): AiAssistantResult {
  return {
    assistantType,
    generatedAt: new Date().toISOString(),
    insights: [
      {
        id: "ask-1",
        title: "Demo response",
        summary: `You asked: "${question.slice(0, 120)}${question.length > 120 ? "…" : ""}" — In demo mode, answers are generic. Enable live AI to get personalized insights from your workspace data.`,
        confidence: 0.6,
        category: "general",
      },
    ],
  };
}

function currentPeriodMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export async function runAiAction(
  action: AiActionType,
  context?: { creatorName?: string; sponsorName?: string }
) {
  const required = actionFeatureRequirements[action];
  const permError = await requireFeatureAccess(required, "AI tools");
  if (permError) return permError;

  const aiRequestCount = await getUsageMetricCount("ai_requests");
  const limitError = await requireUsageWithinLimit(
    "ai_requests",
    aiRequestCount,
    "AI requests this month"
  );
  if (limitError) return limitError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const assistantType = getAssistantForAction(action);
  const run = await runAssistantAction(action, context);

  await supabase.from("ai_usage_tracking").insert({
    organization_id: organizationId,
    assistant_type: assistantType,
    action,
    tokens_used: run.tokensUsed,
    period_month: currentPeriodMonth(),
    metadata: {
      mode: run.mode,
      model: run.model,
    },
  });

  await incrementUsageMetric("ai_requests");

  revalidatePath("/ai");
  revalidatePath("/billing");

  return {
    success: true,
    result: run.result,
    mode: run.mode,
    fallbackNotice: run.fallbackNotice,
  };
}

export async function runCreatorContentAnalysis(
  creatorId: string,
  scope: ContentAnalysisScope = "all"
) {
  const permError = await requireFeatureAccess(
    ["ai_growth", "ai_creator_performance"],
    "AI content analysis"
  );
  if (permError) return permError;

  const aiRequestCount = await getUsageMetricCount("ai_requests");
  const limitError = await requireUsageWithinLimit(
    "ai_requests",
    aiRequestCount,
    "AI requests this month"
  );
  if (limitError) return limitError;

  const connectedPlatforms = await getConnectedOAuthPlatformsForCreator(creatorId);
  if (connectedPlatforms.length === 0) {
    return {
      error:
        "Connect at least one platform via OAuth (YouTube, Twitch, Instagram, or TikTok) to analyze recent content.",
      upgradeRequired: false,
    };
  }

  if (scope !== "all" && !connectedPlatforms.includes(scope)) {
    return {
      error: `Connect this creator's ${scope} account via OAuth first.`,
      upgradeRequired: false,
    };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { data: creator } = await supabase
    .from("creators")
    .select("id, name")
    .eq("id", creatorId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!creator) return { error: "Creator not found." };

  let mode: "live" | "demo" = "demo";
  let tokensUsed = 0;
  let result;
  let analyzedPlatforms: string[] = [];
  let fallbackNotice: string | undefined;

  try {
    if (isAiFeatureEnabled() && (await canRunLiveAi(organizationId))) {
      const [snapshots, workspace] = await Promise.all([
        fetchCreatorContentSnapshots(creatorId, scope),
        buildAiWorkspaceContext(),
      ]);

      const analyzable = getAnalyzablePlatforms(snapshots);
      analyzedPlatforms = analyzable.map((snapshot) => snapshot.platform);

      if (analyzable.length === 0) {
        const connectedButEmpty = snapshots.filter(
          (snapshot) => snapshot.connectedViaOAuth
        );
        if (connectedButEmpty.length > 0) {
          return {
            error:
              "Connected platforms have no recent content yet. Publish a video or stream first, then try again.",
          };
        }
        return {
          error:
            "No analyzable platform content found. Connect a platform via OAuth first.",
        };
      }

      const prompt = buildContentAnalysisPrompt(
        creator.name,
        analyzable,
        summarizeContextForPrompt(workspace)
      );
      const live = await executeLiveAiPrompt({
        system: prompt.system,
        user: prompt.user,
        assistantType: "growth",
      });
      if (live.ok) {
        result = live.result;
        tokensUsed = live.tokensUsed;
        mode = "live";
      } else {
        analyzedPlatforms =
          scope === "all" ? connectedPlatforms : [scope];
        result = generateAssistantResult("content_strategy", {
          creatorName: creator.name,
        });
      }
    } else {
      analyzedPlatforms =
        scope === "all" ? connectedPlatforms : [scope];
      result = generateAssistantResult("content_strategy", {
        creatorName: creator.name,
      });
    }
  } catch (error) {
    if ((await canRunLiveAi(organizationId)) && isRecoverableLlmError(error)) {
      analyzedPlatforms =
        scope === "all" ? connectedPlatforms : [scope];
      result = generateAssistantResult("content_strategy", {
        creatorName: creator.name,
      });
      mode = "demo";
      fallbackNotice = getLlmFallbackNotice(error);
    } else {
      const message =
        error instanceof Error ? error.message : "Content analysis failed.";
      return { error: message };
    }
  }

  await supabase.from("ai_usage_tracking").insert({
    organization_id: organizationId,
    assistant_type: "growth",
    action: "content_strategy",
    tokens_used: tokensUsed,
    period_month: currentPeriodMonth(),
    metadata: {
      mode,
      creatorId,
      scope,
      platforms: analyzedPlatforms,
    },
  });

  await incrementUsageMetric("ai_requests");

  revalidatePath(`/creators/${creatorId}`);
  revalidatePath("/ai");
  revalidatePath("/billing");

  return {
    success: true,
    result,
    mode,
    platforms: analyzedPlatforms,
    fallbackNotice,
  };
}

export async function runAiQuestion(question: string) {
  const trimmed = question.trim();
  if (!trimmed) {
    return { error: "Please enter a question." };
  }
  if (trimmed.length > MAX_QUESTION_LENGTH) {
    return {
      error: `Questions must be ${MAX_QUESTION_LENGTH} characters or fewer.`,
    };
  }

  const permError = await requireFeatureAccess(aiFeatureKeys, "AI tools");
  if (permError) return permError;

  const aiRequestCount = await getUsageMetricCount("ai_requests");
  const limitError = await requireUsageWithinLimit(
    "ai_requests",
    aiRequestCount,
    "AI requests this month"
  );
  if (limitError) return limitError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const assistantType = routeQuestionAssistantType(trimmed);
  let mode: "live" | "demo" = "demo";
  let tokensUsed = 0;
  let model: string | null = null;
  let result: AiAssistantResult;
  let fallbackNotice: string | undefined;

  try {
    if (isAiFeatureEnabled() && (await canRunLiveAi(organizationId))) {
      const workspace = await buildAiWorkspaceContext();
      const contextJson = summarizeContextForPrompt(workspace);
      const prompt = buildQuestionPrompt(trimmed, contextJson);
      const live = await executeLiveAiPrompt({
        system: prompt.system,
        user: prompt.user,
        assistantType,
      });
      if (live.ok) {
        result = live.result;
        tokensUsed = live.tokensUsed;
        model = live.model;
        mode = "live";
      } else {
        result = generateQuestionDemoResult(trimmed, assistantType);
      }
    } else {
      result = generateQuestionDemoResult(trimmed, assistantType);
    }
  } catch (error) {
    if ((await canRunLiveAi(organizationId)) && isRecoverableLlmError(error)) {
      result = generateQuestionDemoResult(trimmed, assistantType);
      mode = "demo";
      fallbackNotice = getLlmFallbackNotice(error);
    } else {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to answer your question.";
      return { error: message };
    }
  }

  await supabase.from("ai_usage_tracking").insert({
    organization_id: organizationId,
    assistant_type: assistantType,
    action: "ask_question",
    tokens_used: tokensUsed,
    period_month: currentPeriodMonth(),
    metadata: {
      mode,
      model,
      questionLength: trimmed.length,
    },
  });

  await incrementUsageMetric("ai_requests");

  revalidatePath("/ai");
  revalidatePath("/billing");

  return { success: true, result, mode, fallbackNotice };
}

export async function runContractSummary(contractId: string) {
  const permError = await requireFeatureAccess(
    ["ai_contract_summaries"],
    "AI contract summaries"
  );
  if (permError) return permError;

  const aiRequestCount = await getUsageMetricCount("ai_requests");
  const limitError = await requireUsageWithinLimit(
    "ai_requests",
    aiRequestCount,
    "AI requests this month"
  );
  if (limitError) return limitError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const contractContext = await buildContractSummaryContext(contractId);
  if (!contractContext) return { error: "Contract not found." };

  const { contract } = contractContext;
  let mode: "live" | "demo" = "demo";
  let tokensUsed = 0;
  let result;
  let fallbackNotice: string | undefined;

  try {
    if (isAiFeatureEnabled() && (await canRunLiveAi(organizationId))) {
      const contextJson = JSON.stringify(contractContext, null, 2);
      const prompt = buildContractSummaryPrompt(contextJson);
      const live = await executeLiveAiPrompt({
        system: prompt.system,
        user: prompt.user,
        assistantType: "revenue",
      });
      if (live.ok) {
        result = live.result;
        tokensUsed = live.tokensUsed;
        mode = "live";
      } else {
        result = generateContractSummaryDemo({
          contractName: contract.name,
          creatorName: contract.creatorName,
          sponsorName: contract.sponsorName,
          status: contract.status,
          contractValue: contract.value,
        });
      }
    } else {
      result = generateContractSummaryDemo({
        contractName: contract.name,
        creatorName: contract.creatorName,
        sponsorName: contract.sponsorName,
        status: contract.status,
        contractValue: contract.value,
      });
    }
  } catch (error) {
    if ((await canRunLiveAi(organizationId)) && isRecoverableLlmError(error)) {
      result = generateContractSummaryDemo({
        contractName: contract.name,
        creatorName: contract.creatorName,
        sponsorName: contract.sponsorName,
        status: contract.status,
        contractValue: contract.value,
      });
      mode = "demo";
      fallbackNotice = getLlmFallbackNotice(error);
    } else {
      const message =
        error instanceof Error ? error.message : "Contract summary failed.";
      return { error: message };
    }
  }

  await supabase.from("ai_usage_tracking").insert({
    organization_id: organizationId,
    assistant_type: "revenue",
    action: "summarize_contract",
    tokens_used: tokensUsed,
    period_month: currentPeriodMonth(),
    metadata: {
      mode,
      contractId,
      contractStatus: contract.status,
    },
  });

  await incrementUsageMetric("ai_requests");

  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/ai");
  revalidatePath("/billing");

  return {
    success: true,
    result,
    mode,
    fallbackNotice,
  };
}
