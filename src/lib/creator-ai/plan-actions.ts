"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { loadPortalCoachPageData } from "@/lib/portal/coach-page-data";
import { incrementUsageMetric } from "@/lib/subscription/usage";
import {
  buildCreatorAiContext,
  serializeCreatorAiContextForPrompt,
} from "./context";
import {
  createCreatorAiConversation,
  getCreatorAiConversation,
  insertCreatorAiMessage,
} from "./queries";
import { runCreatorAiPlanGeneration } from "./plan";
import {
  activateCreatorContentPlan,
  archiveCreatorContentPlan,
  createCreatorContentPlan,
  getCreatorContentPlan,
  listCreatorContentPlans,
} from "./plan-queries";
import {
  syncContentPlanToSchedule,
  type PlanSyncSummary,
} from "./plan-sync";
import { requireCreatorAiCoachAccess } from "./permissions";
import type { CreatorContentPlan } from "./plan-types";
import type { CreatorAiMessage } from "./types";

const DEFAULT_WEEKS_AHEAD = 2;
const MAX_WEEKS_AHEAD = 4;

function currentPeriodMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function clampWeeksAhead(weeksAhead?: number): number {
  const value = weeksAhead ?? DEFAULT_WEEKS_AHEAD;
  return Math.min(MAX_WEEKS_AHEAD, Math.max(2, value));
}

function buildPlanAssistantMessage(plan: CreatorContentPlan): string {
  const itemCount = plan.plan.weeks.reduce(
    (total, week) => total + week.items.length,
    0
  );
  return `Here's your ${plan.plan.weeks.length}-week posting plan (${itemCount} items, ${plan.periodStart} – ${plan.periodEnd}). Review the schedule below and activate when you're ready — activating will add matching events to your calendar.`;
}

export async function generateCreatorContentPlanAction(input: {
  conversationId?: string | null;
  weeksAhead?: number;
}): Promise<
  | {
      success: true;
      conversationId: string;
      plan: CreatorContentPlan;
      assistantMessage: CreatorAiMessage;
      mode: "live" | "demo";
      fallbackNotice?: string;
    }
  | { error: string; upgradeRequired?: boolean }
> {
  const access = await requireCreatorAiCoachAccess();
  if ("error" in access) return access;

  const weeksAhead = clampWeeksAhead(input.weeksAhead);
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  let conversationId = input.conversationId ?? null;

  if (conversationId) {
    const existing = await getCreatorAiConversation(
      conversationId,
      access.userId
    );
    if (!existing) {
      return { error: "Conversation not found." };
    }
  } else {
    const created = await createCreatorAiConversation({
      userId: access.userId,
      creatorId: access.creatorId,
      title: "Posting plan",
    });
    if (!created) {
      return { error: "Could not start a new conversation." };
    }
    conversationId = created.id;
  }

  const pageData = await loadPortalCoachPageData(access.creatorId);
  if (!pageData) {
    return { error: "Could not load creator context." };
  }

  const aiContext = buildCreatorAiContext({
    coachContext: pageData.coachContext,
    coachProfile: pageData.coachProfile,
    analytics: pageData.audienceAnalytics,
    contentSnapshots: pageData.contentSnapshots,
    recommendations: pageData.coachSnapshot?.recommendations ?? [],
  });
  const contextJson = serializeCreatorAiContextForPrompt(aiContext);

  const userPrompt = `Generate a ${weeksAhead}-week posting plan`;
  const userMessage = await insertCreatorAiMessage({
    conversationId: conversationId!,
    role: "user",
    content: userPrompt,
  });
  if (!userMessage) {
    return { error: "Could not save your request." };
  }

  const generation = await runCreatorAiPlanGeneration({
    context: aiContext,
    contextJson,
    weeksAhead,
  });

  const plan = await createCreatorContentPlan({
    userId: access.userId,
    creatorId: access.creatorId,
    conversationId: conversationId!,
    periodStart: generation.periodStart,
    periodEnd: generation.periodEnd,
    plan: generation.plan,
    status: "draft",
  });

  if (!plan) {
    return { error: "Could not save the content plan." };
  }

  const assistantMessage = await insertCreatorAiMessage({
    conversationId: conversationId!,
    role: "assistant",
    content: buildPlanAssistantMessage(plan),
    metadata: {
      type: "content_plan",
      planId: plan.id,
      planStatus: plan.status,
      mode: generation.mode,
      model: generation.model,
      tokensUsed: generation.tokensUsed,
    },
  });

  if (!assistantMessage) {
    return { error: "Could not save the plan message." };
  }

  await supabase.from("ai_usage_tracking").insert({
    organization_id: access.organizationId,
    assistant_type: "growth",
    action: "creator_ai_plan",
    tokens_used: generation.tokensUsed,
    period_month: currentPeriodMonth(),
    metadata: {
      mode: generation.mode,
      model: generation.model,
      conversation_id: conversationId,
      creator_id: access.creatorId,
      plan_id: plan.id,
      weeks_ahead: weeksAhead,
    },
  });

  await incrementUsageMetric("ai_requests");

  revalidatePath("/portal/coach");
  revalidatePath("/billing");

  return {
    success: true,
    conversationId: conversationId!,
    plan,
    assistantMessage,
    mode: generation.mode,
    fallbackNotice: generation.fallbackNotice,
  };
}

export async function getCreatorContentPlanAction(planId: string): Promise<
  | { success: true; plan: CreatorContentPlan }
  | { error: string; upgradeRequired?: boolean }
> {
  const access = await requireCreatorAiCoachAccess();
  if ("error" in access) return access;

  const plan = await getCreatorContentPlan(planId, access.userId);
  if (!plan || plan.creatorId !== access.creatorId) {
    return { error: "Plan not found." };
  }

  return { success: true, plan };
}

export async function listCreatorContentPlansAction(
  creatorId: string
): Promise<
  | { success: true; plans: CreatorContentPlan[] }
  | { error: string; upgradeRequired?: boolean }
> {
  const access = await requireCreatorAiCoachAccess();
  if ("error" in access) return access;

  if (creatorId !== access.creatorId) {
    return { error: "Plan not found." };
  }

  const plans = await listCreatorContentPlans(access.userId, access.creatorId);
  return { success: true, plans };
}

export async function activateCreatorContentPlanAction(planId: string): Promise<
  | { success: true; plan: CreatorContentPlan; sync: PlanSyncSummary }
  | { error: string; upgradeRequired?: boolean }
> {
  const access = await requireCreatorAiCoachAccess();
  if ("error" in access) return access;

  const activation = await activateCreatorContentPlan(
    planId,
    access.userId,
    access.creatorId
  );

  if (!activation) {
    return { error: "Could not activate plan. It may not exist or is not a draft." };
  }

  const sync = await syncContentPlanToSchedule({
    planId: activation.plan.id,
    userId: access.userId,
    creatorId: access.creatorId,
    organizationId: access.organizationId,
    newPlan: activation.plan,
    previousActivePlan: activation.previousActivePlan,
  });

  revalidatePath("/portal/coach");
  revalidatePath("/schedule");
  return { success: true, plan: activation.plan, sync };
}

export async function archiveCreatorContentPlanAction(planId: string): Promise<
  | { success: true }
  | { error: string; upgradeRequired?: boolean }
> {
  const access = await requireCreatorAiCoachAccess();
  if ("error" in access) return access;

  const existing = await getCreatorContentPlan(planId, access.userId);
  if (!existing || existing.creatorId !== access.creatorId) {
    return { error: "Plan not found." };
  }

  const archived = await archiveCreatorContentPlan(planId, access.userId);
  if (!archived) {
    return { error: "Could not archive plan." };
  }

  revalidatePath("/portal/coach");
  return { success: true };
}
