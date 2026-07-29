import { COACH_PRIMARY_GOALS } from "./profile-types";
import type { CoachContext, DailyMission, MissionTask, Recommendation } from "./types";

function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function missionId(scope: CoachContext["scope"], scopeId: string | null, date: string, sequence = 0) {
  const key = scopeId ?? "org";
  return `mission-${scope}-${key}-${date}-${sequence}`;
}

const CREATOR_FALLBACK_TASKS = [
  "Review your latest content performance",
  "Plan your next piece of content",
  "Engage with your community",
] as const;

const ORG_FALLBACK_TASKS = [
  "Review roster performance metrics",
  "Check in with a creator on your roster",
  "Review open sponsorship opportunities",
] as const;

function uniqueTasks(tasks: MissionTask[]): MissionTask[] {
  const seen = new Set<string>();
  return tasks.filter((task) => {
    const key = task.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildMissionTasks(
  context: CoachContext,
  recommendations: Recommendation[]
): MissionTask[] {
  const tasks: MissionTask[] = [];

  for (const item of context.profileReadinessItems.filter((entry) => !entry.done)) {
    if (tasks.length >= 3) break;
    tasks.push({
      id: `readiness-${item.id}`,
      title: item.label,
      completed: false,
    });
  }

  for (const recommendation of recommendations) {
    if (tasks.length >= 3) break;
    tasks.push({
      id: `rec-${recommendation.id}`,
      title: recommendation.title,
      completed: false,
    });
  }

  if (context.scope === "creator" && context.overdueDeliverables > 0 && tasks.length < 3) {
    tasks.push({
      id: "deliverable-overdue",
      title: `Clear ${context.overdueDeliverables} overdue deliverable${context.overdueDeliverables === 1 ? "" : "s"}`,
      completed: false,
    });
  }

  if (context.streamScheduleMissing && tasks.length < 3) {
    tasks.push({
      id: "schedule-block",
      title: "Block time on your schedule",
      completed: false,
    });
  }

  const missedCadenceDays =
    context.postingCadence?.missedPostingDaysThisWeek ?? [];
  if (
    context.scope === "creator" &&
    missedCadenceDays.length > 0 &&
    tasks.length < 3
  ) {
    tasks.push({
      id: "cadence-missed-upload",
      title:
        missedCadenceDays.length === 1
          ? `Publish for missed ${missedCadenceDays[0]} upload`
          : `Catch up on ${missedCadenceDays.length} missed uploads`,
      completed: false,
    });
  }

  if (context.unreadMessages > 0 && tasks.length < 3) {
    tasks.push({
      id: "messages-respond",
      title: `Respond to ${context.unreadMessages} unread message${context.unreadMessages === 1 ? "" : "s"}`,
      completed: false,
    });
  }

  if (context.scope === "organization" && context.pendingApplications > 0 && tasks.length < 3) {
    tasks.push({
      id: "review-applications",
      title: `Review ${context.pendingApplications} pending application${context.pendingApplications === 1 ? "" : "s"}`,
      completed: false,
    });
  }

  if (tasks.length === 0) {
    return [
      {
        id: "default-check-analytics",
        title:
          context.scope === "creator"
            ? "Review your latest content performance"
            : "Review roster performance metrics",
        completed: false,
      },
      {
        id: "default-plan-content",
        title:
          context.scope === "creator"
            ? "Plan your next piece of content"
            : "Check in with a creator on your roster",
        completed: false,
      },
      {
        id: "default-engage",
        title:
          context.scope === "creator"
            ? "Engage with your community"
            : "Review open sponsorship opportunities",
        completed: false,
      },
    ];
  }

  const fallbacks =
    context.scope === "creator" ? CREATOR_FALLBACK_TASKS : ORG_FALLBACK_TASKS;
  let fallbackIndex = 0;
  while (tasks.length < 3) {
    tasks.push({
      id: `fallback-${fallbackIndex}`,
      title: fallbacks[fallbackIndex % fallbacks.length],
      completed: false,
    });
    fallbackIndex += 1;
  }

  return uniqueTasks(tasks).slice(0, 3);
}

function buildMissionTitle(context: CoachContext, recommendations: Recommendation[]): string {
  if (context.overdueDeliverables > 0) return "Clear your sponsorship backlog";
  if (recommendations[0]?.priority === "Critical") return recommendations[0].title;
  if ((context.postingCadence?.missedPostingDaysThisWeek.length ?? 0) > 0) {
    return "Get back on your posting rhythm";
  }
  if (context.noRevenueTracking) return "Set up your revenue foundation";
  if (context.streamScheduleMissing) return "Build your streaming rhythm";
  if (context.scope === "organization" && (context.expiringContractsCount ?? 0) > 0) {
    return "Protect your contract pipeline";
  }
  return context.scope === "creator"
    ? "Grow your creator business today"
    : "Move your roster forward today";
}

function buildMissionSubtitle(context: CoachContext): string {
  const goal = context.coachProfile?.primaryGoal
    ? COACH_PRIMARY_GOALS.find((entry) => entry.id === context.coachProfile?.primaryGoal)
    : null;

  if (context.scope === "creator" && goal) {
    return `Three focused actions tuned to your goal: ${goal.label.toLowerCase()}.`;
  }
  if (context.scope === "creator") {
    return "Three focused actions based on your real metrics and profile.";
  }
  return "Three workspace priorities based on your roster and pipeline data.";
}

export function generateDailyMission(
  context: CoachContext,
  recommendations: Recommendation[],
  options: { date?: Date; sequence?: number; preserveTasks?: MissionTask[] } = {}
): DailyMission {
  const date = options.date ?? new Date();
  const dateStr = todayKey(date);
  const tasks = options.preserveTasks ?? buildMissionTasks(context, recommendations);

  return {
    id: missionId(context.scope, context.scopeId, dateStr, options.sequence ?? 0),
    title: buildMissionTitle(context, recommendations),
    subtitle: buildMissionSubtitle(context),
    tasks,
    generatedAt: date.toISOString(),
    missionDate: dateStr,
  };
}

export function getMissionProgress(mission: DailyMission): number {
  if (mission.tasks.length === 0) return 0;
  const completed = mission.tasks.filter((task) => task.completed).length;
  return Math.round((completed / mission.tasks.length) * 100);
}

export function isMissionComplete(mission: DailyMission): boolean {
  return mission.tasks.length > 0 && mission.tasks.every((task) => task.completed);
}

export function completeMissionTask(
  mission: DailyMission,
  taskId: string
): DailyMission {
  return {
    ...mission,
    tasks: mission.tasks.map((task) =>
      task.id === taskId ? { ...task, completed: true } : task
    ),
  };
}

export function nextMissionSequence(mission: DailyMission): number {
  const parts = mission.id.split("-");
  const last = parts[parts.length - 1];
  const parsed = Number.parseInt(last ?? "0", 10);
  return Number.isNaN(parsed) ? 1 : parsed + 1;
}
