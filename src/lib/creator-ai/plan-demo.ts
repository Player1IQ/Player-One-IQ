import type { CreatorAiContext } from "./types";
import {
  computePlanPeriod,
  dayOfWeekFromDate,
  formatPlanDate,
  formatWeekLabel,
  generateContentPlanItemId,
  type ContentPlanPayload,
} from "./plan-types";

const DAY_NAME_TO_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

function resolvePostingDays(context: CreatorAiContext): number[] {
  const profileDays = context.coachProfile?.targetPostingDays ?? [];
  const cadenceDays = context.postingCadence?.typicalPostingDays ?? [];
  const source = profileDays.length > 0 ? profileDays : cadenceDays;

  const indices = source
    .map((day) => DAY_NAME_TO_INDEX[day])
    .filter((index): index is number => index !== undefined);

  if (indices.length > 0) {
    return [...new Set(indices)].sort((a, b) => a - b);
  }

  return [2, 4];
}

function pickPlatform(context: CreatorAiContext): string {
  if (context.primaryPlatform) return context.primaryPlatform;
  const top = context.platformBreakdown[0]?.platform;
  return top ?? "YouTube";
}

function pickContentType(platform: string, index: number): "video" | "clip" | "post" | "stream" | "reel" {
  const lower = platform.toLowerCase();
  if (lower.includes("twitch")) return index % 2 === 0 ? "stream" : "clip";
  if (lower.includes("instagram")) return index % 2 === 0 ? "reel" : "post";
  if (lower.includes("tiktok")) return "clip";
  return index % 2 === 0 ? "video" : "clip";
}

export function generateCreatorAiDemoPlan(
  context: CreatorAiContext,
  weeksAhead = 2
): ContentPlanPayload {
  const { weekStarts } = computePlanPeriod(weeksAhead);
  const postingDays = resolvePostingDays(context);
  const platform = pickPlatform(context);
  const name = context.displayName.split(" ")[0] || "Creator";

  const weeks = weekStarts.map((weekStart) => {
    const [year, month, day] = weekStart.split("-").map(Number);
    const weekAnchor = new Date(year, (month ?? 1) - 1, day ?? 1);
    const items = postingDays.map((dayIndex, itemIndex) => {
      const date = new Date(weekAnchor);
      date.setDate(weekAnchor.getDate() + dayIndex);
      const dateStr = formatPlanDate(date);
      const contentType = pickContentType(platform, itemIndex);

      return {
        id: generateContentPlanItemId({ date: dateStr, platform, contentType }),
        date: dateStr,
        dayOfWeek: dayOfWeekFromDate(dateStr),
        platform,
        contentType,
        topic:
          itemIndex === 0
            ? `Core ${contentType} aligned with your ${context.coachProfile?.primaryGoal ?? "growth"} goal`
            : `Repurpose highlights into a ${contentType}`,
        rationale:
          itemIndex === 0
            ? `Keeps ${name} visible on ${platform} on a typical posting day.`
            : "Extends reach without starting from scratch — demo plan suggestion.",
        suggestedTime: itemIndex === 0 ? "14:00" : "18:30",
      };
    });

    return {
      weekStart,
      label: `Week of ${formatWeekLabel(weekStart)}`,
      items,
    };
  });

  return {
    weeks,
    summary: `Demo ${weekStarts.length}-week plan for ${name} on ${platform}, spaced across your typical posting days. Connect live AI for a plan tailored to your real analytics and recommendations.`,
    generatedAt: new Date().toISOString(),
  };
}
