"use client";

import { useTranslations } from "next-intl";
import type { CoachContext, DailyMission, Recommendation } from "@/lib/creator-coach/types";
import { formatDayList } from "@/lib/creator-coach/posting-cadence";

type RuleParams = Record<string, string | number>;

function buildRuleParams(
  ruleId: string,
  context: CoachContext,
  recommendation: Recommendation
): RuleParams {
  const cadence = context.postingCadence;
  const missedLabel = cadence
    ? formatDayList(cadence.missedPostingDaysThisWeek)
    : "";
  const rhythmOnly = cadence
    ? cadence.typicalPostingDays.filter(
        (day) => !cadence.missedPostingDaysThisWeek.includes(day)
      )
    : [];
  const rhythmOnlyLabel = formatDayList(rhythmOnly);
  const incomplete = context.profileReadinessItems.find((item) => !item.done);
  const challenge = context.coachProfile?.biggestChallenge?.trim() ?? "";
  const days =
    context.coachProfile?.targetPostingDays.length &&
    context.coachProfile.targetPostingDays.length > 0
      ? context.coachProfile.targetPostingDays.join(", ")
      : "your chosen days";
  const interests =
    context.coachProfile?.monetizationInterests.slice(0, 2).join(", ") ?? "";

  const base: RuleParams = {
    streamedHours: context.streamedHours,
    clipsCreated: context.clipsCreated,
    engagementRate: context.engagementRate,
    uploadsCompleted: context.uploadsCompleted,
    uploadGoal: context.uploadGoal,
    followersGrowth: context.followersGrowth ?? 0,
    overdueDeliverables: context.overdueDeliverables,
    openOpportunities: context.openOpportunities,
    unreadMessages: context.unreadMessages,
    pendingApplications: context.pendingApplications,
    activeCreatorsCount: context.activeCreatorsCount ?? 0,
    expiringContractsCount: context.expiringContractsCount ?? 0,
    profileReadinessScore: context.profileReadinessScore,
    nextStep: incomplete?.label.toLowerCase() ?? "",
    primaryPlatform: context.primaryPlatform ?? "main",
    missedLabel,
    missedCount: cadence?.missedPostingDaysThisWeek.length ?? 0,
    rhythmOnlyLabel,
    days,
    challenge,
    interests,
    sponsorDeals: context.sponsorDeals,
  };

  if (ruleId === "goals-missed-posting-cadence" && cadence) {
    base.descriptionVariant =
      rhythmOnly.length === 0 || rhythmOnlyLabel === missedLabel
        ? "missedOnly"
        : "missedWithRhythm";
  }

  if (ruleId === "productivity-stream-schedule") {
    base.scope = context.scope;
  }

  void recommendation;
  return base;
}

export function useRecommendationText(
  recommendation: Recommendation,
  coachContext: CoachContext
) {
  const tRules = useTranslations("coach.rules");
  const tCoach = useTranslations("coach");
  const params = buildRuleParams(recommendation.id, coachContext, recommendation);
  const id = recommendation.id;

  const title =
    id === "productivity-stream-schedule"
      ? tRules(`${id}.title.${coachContext.scope}` as never, params as never)
      : tRules(`${id}.title` as never, params as never);

  const description =
    id === "goals-missed-posting-cadence" &&
    params.descriptionVariant === "missedWithRhythm"
      ? tRules(`${id}.descriptionWithRhythm` as never, params as never)
      : id === "business-revenue-tracking" || id === "productivity-stream-schedule"
        ? tRules(`${id}.description.${coachContext.scope}` as never, params as never)
        : tRules(`${id}.description` as never, params as never);

  const actionLabel =
    id === "business-revenue-tracking"
      ? tRules(`${id}.actionLabel.${coachContext.scope}` as never, params as never)
      : tRules(`${id}.actionLabel` as never, params as never);

  return {
    title,
    description,
    whyItMatters: tRules(`${id}.whyItMatters` as never, params as never),
    estimatedImpact: tRules(`${id}.estimatedImpact` as never, params as never),
    actionLabel,
    category: tCoach(`categories.${recommendation.category}` as never),
    priority: tCoach(`priorities.${recommendation.priority}` as never),
  };
}

const MISSION_TITLE_KEYS: Record<string, string> = {
  "Clear your sponsorship backlog": "clearBacklog",
  "Get back on your posting rhythm": "postingRhythm",
  "Set up your revenue foundation": "revenueFoundation",
  "Build your streaming rhythm": "streamingRhythm",
  "Protect your contract pipeline": "contractPipeline",
  "Grow your creator business today": "growCreator",
  "Move your roster forward today": "moveRoster",
};

export function useMissionText(mission: DailyMission, coachContext: CoachContext) {
  const tMission = useTranslations("coach.mission");
  const tCoach = useTranslations("coach");
  const goalId = coachContext.coachProfile?.primaryGoal ?? "";

  const titleKey = MISSION_TITLE_KEYS[mission.title];
  const title = titleKey
    ? tMission(`titles.${titleKey}` as never)
    : mission.title;

  let subtitle = mission.subtitle;
  if (coachContext.scope === "creator" && goalId) {
    const goalLabel = tCoach(`goals.${goalId}.label` as never);
    subtitle = tMission("subtitles.withGoal", { goal: goalLabel });
  } else if (coachContext.scope === "creator") {
    subtitle = tMission("subtitles.creator");
  } else {
    subtitle = tMission("subtitles.organization");
  }

  const tasks = mission.tasks.map((task) => ({
    ...task,
    title: translateMissionTaskTitle(task.id, task.title, tMission, coachContext),
  }));

  return { title, subtitle, tasks };
}

function translateMissionTaskTitle(
  taskId: string,
  fallback: string,
  tMission: ReturnType<typeof useTranslations<"coach.mission">>,
  context: CoachContext
): string {
  if (taskId.startsWith("rec-")) return fallback;
  if (taskId.startsWith("readiness-")) return fallback;

  const params: RuleParams = {
    count: context.overdueDeliverables,
    unreadMessages: context.unreadMessages,
    pendingApplications: context.pendingApplications,
    missedCount: context.postingCadence?.missedPostingDaysThisWeek.length ?? 0,
    missedDay: context.postingCadence?.missedPostingDaysThisWeek[0] ?? "",
  };

  const keyMap: Record<string, string> = {
    "deliverable-overdue": "clearOverdue",
    "schedule-block": "scheduleBlock",
    "cadence-missed-upload": "cadenceMissed",
    "messages-respond": "respondMessages",
    "review-applications": "reviewApplications",
    "default-check-analytics": context.scope === "creator" ? "reviewPerformance" : "reviewRoster",
    "default-plan-content": context.scope === "creator" ? "planContent" : "checkInCreator",
    "default-engage": context.scope === "creator" ? "engageCommunity" : "reviewOpportunities",
    "fallback-0": context.scope === "creator" ? "reviewPerformance" : "reviewRoster",
    "fallback-1": context.scope === "creator" ? "planContent" : "checkInCreator",
    "fallback-2": context.scope === "creator" ? "engageCommunity" : "reviewOpportunities",
  };

  const baseKey = keyMap[taskId];
  if (!baseKey) return fallback;

  if (baseKey === "clearOverdue") {
    return tMission("tasks.clearOverdue", { count: params.count });
  }
  if (baseKey === "cadenceMissed") {
    return params.missedCount === 1
      ? tMission("tasks.cadenceMissedSingle", { day: params.missedDay })
      : tMission("tasks.cadenceMissedMultiple", { count: params.missedCount });
  }
  if (baseKey === "respondMessages") {
    return tMission("tasks.respondMessages", { count: params.unreadMessages });
  }
  if (baseKey === "reviewApplications") {
    return tMission("tasks.reviewApplications", { count: params.pendingApplications });
  }
  return tMission(`tasks.${baseKey}` as never);
}

export function useCoachGreeting(name: string, date = new Date()) {
  const t = useTranslations("coach.greeting");
  const hour = date.getHours();
  const period =
    hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const displayName = name.trim() || t("defaultName");
  return t("full", { period, name: displayName });
}
