"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import {
  requireFeatureAccess,
  requireUsageWithinLimit,
} from "@/lib/permissions";
import {
  fetchCreatorContentSnapshots,
  getAnalyzablePlatforms,
} from "@/lib/platform-oauth/content-aggregate";
import type { ContentAnalysisScope } from "@/lib/platform-oauth/content-performance";
import { getConnectedOAuthPlatformsForCreator } from "@/lib/platform-oauth/account-access";
import { getUsageMetricCount, incrementUsageMetric } from "@/lib/subscription/usage";
import {
  generateAssistantResult,
  getAssistantForAction,
} from "./assistants";
import {
  buildAiWorkspaceContext,
  summarizeContextForPrompt,
} from "./context";
import { isAiLlmLive } from "./config";
import { runOpenAiAssistant } from "./llm";
import { buildContentAnalysisPrompt } from "./prompts";
import { runAssistantAction } from "./runner";
import type { AiActionType } from "./types";
import type { FeatureKey } from "@/lib/subscription/types";

const actionFeatureRequirements: Record<AiActionType, FeatureKey[]> = {
  analyze_performance: ["ai_growth", "ai_creator_performance"],
  growth_recommendations: ["ai_growth"],
  content_strategy: ["ai_growth"],
  sponsorship_targets: ["ai_sponsorship"],
  match_creators: ["ai_sponsorship_matching", "ai_creator_discovery"],
  match_sponsors: ["ai_sponsorship_matching"],
  rank_opportunities: ["ai_sponsorship_matching", "ai_campaign_recommendations"],
  forecast_earnings: ["revenue_forecasting", "ai_forecasting"],
  forecast_campaigns: ["ai_roi_forecasting", "ai_forecasting"],
  predict_contract_value: ["ai_deal_recommendations", "revenue_forecasting"],
};

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
  };
}

export async function runCreatorContentAnalysis(
  creatorId: string,
  scope: ContentAnalysisScope = "all"
) {
  const permError = await requireFeatureAccess("ai_growth", "AI content analysis");
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

  try {
    if (isAiLlmLive()) {
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
      const llm = await runOpenAiAssistant({
        system: prompt.system,
        user: prompt.user,
        assistantType: "growth",
      });
      result = llm.result;
      tokensUsed = llm.tokensUsed;
      mode = "live";
    } else {
      analyzedPlatforms =
        scope === "all" ? connectedPlatforms : [scope];
      result = generateAssistantResult("content_strategy", {
        creatorName: creator.name,
      });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Content analysis failed.";
    return { error: message };
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

  return { success: true, result, mode, platforms: analyzedPlatforms };
}
