import { getWeekStart } from "@/lib/schedule/helpers";

export type ContentPlanStatus = "draft" | "active" | "archived";

export const CONTENT_PLAN_CONTENT_TYPES = [
  "video",
  "stream",
  "clip",
  "post",
  "reel",
] as const;

export type ContentPlanContentType = (typeof CONTENT_PLAN_CONTENT_TYPES)[number];

export interface ContentPlanItem {
  id: string;
  date: string;
  dayOfWeek: string;
  platform: string;
  contentType: ContentPlanContentType;
  topic: string;
  rationale: string;
  suggestedTime?: string;
}

export interface ContentPlanWeek {
  weekStart: string;
  label: string;
  items: ContentPlanItem[];
}

export interface ContentPlanPayload {
  weeks: ContentPlanWeek[];
  summary: string;
  generatedAt: string;
}

export interface CreatorContentPlan {
  id: string;
  organizationId: string;
  creatorId: string;
  userId: string;
  conversationId: string | null;
  periodStart: string;
  periodEnd: string;
  plan: ContentPlanPayload;
  status: ContentPlanStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorContentPlanRow {
  id: string;
  organization_id: string;
  creator_id: string;
  user_id: string;
  conversation_id: string | null;
  period_start: string;
  period_end: string;
  plan: ContentPlanPayload | Record<string, unknown>;
  status: ContentPlanStatus;
  created_at: string;
  updated_at: string;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function slugifyPlanSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function generateContentPlanItemId(input: {
  date: string;
  platform: string;
  contentType: string;
}): string {
  const platformSlug = slugifyPlanSegment(input.platform) || "platform";
  const typeSlug = slugifyPlanSegment(input.contentType) || "content";
  return `${input.date}-${platformSlug}-${typeSlug}`;
}

export function formatPlanDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dayOfWeekFromDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1);
  return DAY_NAMES[date.getDay()] ?? "Monday";
}

export function formatWeekLabel(weekStart: string): string {
  const [year, month, day] = weekStart.split("-").map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function computePlanPeriod(weeksAhead: number, anchor = new Date()): {
  periodStart: string;
  periodEnd: string;
  weekStarts: string[];
} {
  const clampedWeeks = Math.min(4, Math.max(2, weeksAhead));
  const firstWeekStart = getWeekStart(anchor);
  const weekStarts: string[] = [];

  for (let index = 0; index < clampedWeeks; index += 1) {
    const weekStart = new Date(firstWeekStart);
    weekStart.setDate(firstWeekStart.getDate() + index * 7);
    weekStarts.push(formatPlanDate(weekStart));
  }

  const lastWeekStart = new Date(firstWeekStart);
  lastWeekStart.setDate(firstWeekStart.getDate() + (clampedWeeks - 1) * 7 + 6);

  return {
    periodStart: formatPlanDate(firstWeekStart),
    periodEnd: formatPlanDate(lastWeekStart),
    weekStarts,
  };
}

function isContentType(value: string): value is ContentPlanContentType {
  return (CONTENT_PLAN_CONTENT_TYPES as readonly string[]).includes(value);
}

function parseContentPlanItem(raw: unknown, index: number): ContentPlanItem | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;

  const date = String(row.date ?? "").trim();
  const platform = String(row.platform ?? "").trim();
  const contentTypeRaw = String(row.contentType ?? row.content_type ?? "post")
    .trim()
    .toLowerCase();
  const topic = String(row.topic ?? "").trim();
  const rationale = String(row.rationale ?? "").trim();

  if (!DATE_PATTERN.test(date) || !platform || !topic || !rationale) {
    return null;
  }

  const contentType = isContentType(contentTypeRaw) ? contentTypeRaw : "post";
  const dayOfWeek =
    String(row.dayOfWeek ?? row.day_of_week ?? "").trim() ||
    dayOfWeekFromDate(date);

  const suggestedTimeRaw = row.suggestedTime ?? row.suggested_time;
  const suggestedTime =
    typeof suggestedTimeRaw === "string" && TIME_PATTERN.test(suggestedTimeRaw)
      ? suggestedTimeRaw
      : undefined;

  const id =
    String(row.id ?? "").trim() ||
    generateContentPlanItemId({ date, platform, contentType });

  return {
    id: id || `plan-item-${index + 1}`,
    date,
    dayOfWeek,
    platform,
    contentType,
    topic,
    rationale,
    ...(suggestedTime ? { suggestedTime } : {}),
  };
}

function parseContentPlanWeek(raw: unknown): ContentPlanWeek | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;

  const weekStart = String(row.weekStart ?? row.week_start ?? "").trim();
  if (!DATE_PATTERN.test(weekStart)) return null;

  const itemsRaw = Array.isArray(row.items) ? row.items : [];
  const items = itemsRaw
    .map((item, itemIndex) => parseContentPlanItem(item, itemIndex))
    .filter((item): item is ContentPlanItem => item !== null);

  const label =
    String(row.label ?? "").trim() || `Week of ${formatWeekLabel(weekStart)}`;

  return {
    weekStart,
    label,
    items,
  };
}

export function validateContentPlanPayload(
  payload: ContentPlanPayload
): string[] {
  const errors: string[] = [];

  if (!payload.summary.trim()) {
    errors.push("Plan summary is required.");
  }

  if (!payload.generatedAt.trim()) {
    errors.push("generatedAt is required.");
  }

  if (!Array.isArray(payload.weeks) || payload.weeks.length === 0) {
    errors.push("At least one week is required.");
    return errors;
  }

  for (const [weekIndex, week] of payload.weeks.entries()) {
    if (!DATE_PATTERN.test(week.weekStart)) {
      errors.push(`Week ${weekIndex + 1} has an invalid weekStart.`);
    }
    if (!week.label.trim()) {
      errors.push(`Week ${weekIndex + 1} is missing a label.`);
    }
    if (week.items.length === 0) {
      errors.push(`Week ${weekIndex + 1} must include at least one item.`);
    }

    for (const [itemIndex, item] of week.items.entries()) {
      if (!item.id.trim()) {
        errors.push(`Week ${weekIndex + 1}, item ${itemIndex + 1} is missing an id.`);
      }
      if (!DATE_PATTERN.test(item.date)) {
        errors.push(`Week ${weekIndex + 1}, item ${itemIndex + 1} has an invalid date.`);
      }
      if (!item.platform.trim()) {
        errors.push(`Week ${weekIndex + 1}, item ${itemIndex + 1} is missing a platform.`);
      }
      if (!isContentType(item.contentType)) {
        errors.push(`Week ${weekIndex + 1}, item ${itemIndex + 1} has an invalid contentType.`);
      }
      if (!item.topic.trim() || !item.rationale.trim()) {
        errors.push(`Week ${weekIndex + 1}, item ${itemIndex + 1} is missing topic or rationale.`);
      }
      if (item.suggestedTime && !TIME_PATTERN.test(item.suggestedTime)) {
        errors.push(`Week ${weekIndex + 1}, item ${itemIndex + 1} has an invalid suggestedTime.`);
      }
    }
  }

  return errors;
}

export function normalizeContentPlanPayload(
  payload: ContentPlanPayload
): ContentPlanPayload {
  return {
    summary: payload.summary.trim(),
    generatedAt: payload.generatedAt.trim(),
    weeks: payload.weeks.map((week) => ({
      weekStart: week.weekStart,
      label: week.label.trim(),
      items: week.items.map((item, index) => {
        const contentType = isContentType(item.contentType)
          ? item.contentType
          : "post";
        const date = item.date;
        return {
          id:
            item.id.trim() ||
            generateContentPlanItemId({
              date,
              platform: item.platform,
              contentType,
            }) ||
            `plan-item-${index + 1}`,
          date,
          dayOfWeek: item.dayOfWeek.trim() || dayOfWeekFromDate(date),
          platform: item.platform.trim(),
          contentType,
          topic: item.topic.trim(),
          rationale: item.rationale.trim(),
          ...(item.suggestedTime ? { suggestedTime: item.suggestedTime } : {}),
        };
      }),
    })),
  };
}

export function extractJsonPayload(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fenced?.[1]?.trim() ?? trimmed;
}

export function parseContentPlanFromLlmResponse(raw: string): ContentPlanPayload {
  const parsed = JSON.parse(extractJsonPayload(raw)) as Record<string, unknown>;

  const weeksRaw = Array.isArray(parsed.weeks) ? parsed.weeks : [];
  const weeks = weeksRaw
    .map((week) => parseContentPlanWeek(week))
    .filter((week): week is ContentPlanWeek => week !== null);

  if (weeks.length === 0) {
    throw new Error("AI response did not include any plan weeks.");
  }

  const payload: ContentPlanPayload = {
    weeks,
    summary: String(parsed.summary ?? "Personalized posting plan").trim(),
    generatedAt: String(parsed.generatedAt ?? new Date().toISOString()).trim(),
  };

  const normalized = normalizeContentPlanPayload(payload);
  const errors = validateContentPlanPayload(normalized);
  if (errors.length > 0) {
    throw new Error(`Invalid content plan: ${errors[0]}`);
  }

  return normalized;
}

export function mapContentPlanRow(row: CreatorContentPlanRow): CreatorContentPlan {
  const planRaw = row.plan;
  const plan =
    planRaw && typeof planRaw === "object" && "weeks" in planRaw
      ? normalizeContentPlanPayload(planRaw as ContentPlanPayload)
      : {
          weeks: [],
          summary: "",
          generatedAt: row.created_at,
        };

  return {
    id: row.id,
    organizationId: row.organization_id,
    creatorId: row.creator_id,
    userId: row.user_id,
    conversationId: row.conversation_id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    plan,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function resolvePlanActivationUpdates(
  plans: Array<{ id: string; status: ContentPlanStatus }>,
  targetPlanId: string
): Array<{ id: string; status: ContentPlanStatus }> {
  const target = plans.find((plan) => plan.id === targetPlanId);
  if (!target) {
    throw new Error("Plan not found.");
  }
  if (target.status !== "draft") {
    throw new Error("Only draft plans can be activated.");
  }

  return plans
    .filter((plan) => plan.status === "active" || plan.id === targetPlanId)
    .map((plan) => ({
      id: plan.id,
      status: plan.id === targetPlanId ? "active" : "archived",
    }));
}
