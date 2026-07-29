import type { PlatformContentSnapshot } from "@/lib/platform-oauth/content-performance";
import type { ContentItemType } from "@/lib/platform-oauth/content-performance";
import { getWeekStart, isSameDay } from "@/lib/schedule/helpers";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const UPLOAD_CONTENT_TYPES = new Set<ContentItemType>([
  "video",
  "stream",
  "post",
  "reel",
]);

const LOOKBACK_DAYS = 56;
const MIN_POSTS_TO_INFER = 8;
const MAX_TYPICAL_DAYS = 3;
const MIN_WEEK_HIT_RATE = 0.4;

export interface PostingCadenceInsight {
  inferred: boolean;
  typicalPostingDays: string[];
  missedPostingDaysThisWeek: string[];
  postsThisWeek: number;
  expectedPostingDaysThisWeek: number;
  lastPublishedAt: string | null;
  daysSinceLastPost: number | null;
  lookbackPostCount: number;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function parsePublishedAt(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function collectUploadPublishDates(
  snapshots: PlatformContentSnapshot[],
  lookbackStart: Date
): Date[] {
  const dates: Date[] = [];

  for (const snapshot of snapshots) {
    if (!snapshot.connectedViaOAuth) continue;
    for (const item of snapshot.items) {
      if (!UPLOAD_CONTENT_TYPES.has(item.contentType)) continue;
      const publishedAt = parsePublishedAt(item.publishedAt);
      if (!publishedAt || publishedAt < lookbackStart) continue;
      dates.push(publishedAt);
    }
  }

  return dates.sort((left, right) => right.getTime() - left.getTime());
}

function isoWeekKey(date: Date): string {
  const weekStart = getWeekStart(date);
  return weekStart.toISOString().slice(0, 10);
}

function inferTypicalPostingDayIndexes(publishDates: Date[]): number[] {
  const weeksWithActivity = new Set(publishDates.map(isoWeekKey));
  const activeWeekCount = weeksWithActivity.size;
  if (activeWeekCount < 3) return [];

  const weekHits = new Map<number, Set<string>>();

  for (const publishedAt of publishDates) {
    const dayIndex = publishedAt.getDay();
    const weeks = weekHits.get(dayIndex) ?? new Set<string>();
    weeks.add(isoWeekKey(publishedAt));
    weekHits.set(dayIndex, weeks);
  }

  const ranked = [...weekHits.entries()]
    .map(([dayIndex, weeks]) => ({
      dayIndex,
      weekHitRate: weeks.size / activeWeekCount,
      totalPosts: publishDates.filter((date) => date.getDay() === dayIndex).length,
    }))
    .filter(
      (entry) =>
        entry.weekHitRate >= MIN_WEEK_HIT_RATE && entry.totalPosts >= 2
    )
    .sort(
      (left, right) =>
        right.weekHitRate - left.weekHitRate ||
        right.totalPosts - left.totalPosts
    )
    .slice(0, MAX_TYPICAL_DAYS)
    .map((entry) => entry.dayIndex)
    .sort((left, right) => left - right);

  return ranked;
}

function countPostsInWeek(publishDates: Date[], weekStart: Date): number {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  const uniqueDays = new Set<string>();

  for (const publishedAt of publishDates) {
    if (publishedAt >= weekStart && publishedAt < weekEnd) {
      uniqueDays.add(publishedAt.toISOString().slice(0, 10));
    }
  }

  return uniqueDays.size;
}

function findMissedPostingDaysThisWeek(
  typicalDayIndexes: number[],
  publishDates: Date[],
  now: Date
): string[] {
  const weekStart = getWeekStart(now);
  const today = startOfDay(now);
  const missed: string[] = [];

  for (const dayIndex of typicalDayIndexes) {
    const offset = dayIndex === 0 ? 6 : dayIndex - 1;
    const targetDay = new Date(weekStart);
    targetDay.setDate(weekStart.getDate() + offset);

    if (targetDay > today) continue;

    const postedOnDay = publishDates.some((publishedAt) =>
      isSameDay(publishedAt, targetDay)
    );

    if (!postedOnDay) {
      missed.push(DAY_NAMES[dayIndex]);
    }
  }

  return missed;
}

export function formatDayList(days: string[]): string {
  if (days.length === 0) return "";
  if (days.length === 1) return days[0];
  if (days.length === 2) return `${days[0]} and ${days[1]}`;
  return `${days.slice(0, -1).join(", ")}, and ${days[days.length - 1]}`;
}

export function analyzePostingCadence(
  snapshots: PlatformContentSnapshot[],
  options: {
    now?: Date;
    lookbackDays?: number;
    manualPostingDays?: string[];
  } = {}
): PostingCadenceInsight {
  const now = options.now ?? new Date();
  const lookbackDays = options.lookbackDays ?? LOOKBACK_DAYS;
  const lookbackStart = new Date(now);
  lookbackStart.setDate(now.getDate() - lookbackDays);

  const publishDates = collectUploadPublishDates(snapshots, lookbackStart);
  const empty: PostingCadenceInsight = {
    inferred: false,
    typicalPostingDays: [],
    missedPostingDaysThisWeek: [],
    postsThisWeek: 0,
    expectedPostingDaysThisWeek: 0,
    lastPublishedAt: null,
    daysSinceLastPost: null,
    lookbackPostCount: publishDates.length,
  };

  const manualDayIndexes =
    options.manualPostingDays
      ?.map((day) => DAY_NAMES.indexOf(day as (typeof DAY_NAMES)[number]))
      .filter((index) => index >= 0) ?? [];

  if (manualDayIndexes.length >= 2) {
    const typicalPostingDays = manualDayIndexes.map((index) => DAY_NAMES[index]);
    const weekStart = getWeekStart(now);
    const missedPostingDaysThisWeek = findMissedPostingDaysThisWeek(
      manualDayIndexes,
      publishDates,
      now
    );

    return {
      inferred: true,
      typicalPostingDays,
      missedPostingDaysThisWeek,
      postsThisWeek: countPostsInWeek(publishDates, weekStart),
      expectedPostingDaysThisWeek: manualDayIndexes.filter((dayIndex) => {
        const offset = dayIndex === 0 ? 6 : dayIndex - 1;
        const targetDay = new Date(weekStart);
        targetDay.setDate(weekStart.getDate() + offset);
        return targetDay <= startOfDay(now);
      }).length,
      lastPublishedAt: publishDates[0]?.toISOString() ?? null,
      daysSinceLastPost: publishDates[0]
        ? Math.floor(
            (startOfDay(now).getTime() - startOfDay(publishDates[0]).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null,
      lookbackPostCount: publishDates.length,
    };
  }

  if (publishDates.length < MIN_POSTS_TO_INFER) {
    return {
      ...empty,
      postsThisWeek: countPostsInWeek(publishDates, getWeekStart(now)),
    };
  }

  const typicalDayIndexes = inferTypicalPostingDayIndexes(publishDates);
  if (typicalDayIndexes.length === 0) {
    return {
      ...empty,
      postsThisWeek: countPostsInWeek(publishDates, getWeekStart(now)),
      lastPublishedAt: publishDates[0]?.toISOString() ?? null,
      daysSinceLastPost: publishDates[0]
        ? Math.floor(
            (startOfDay(now).getTime() - startOfDay(publishDates[0]).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null,
    };
  }

  const typicalPostingDays = typicalDayIndexes.map((index) => DAY_NAMES[index]);
  const missedPostingDaysThisWeek = findMissedPostingDaysThisWeek(
    typicalDayIndexes,
    publishDates,
    now
  );
  const weekStart = getWeekStart(now);
  const lastPublishedAt = publishDates[0]?.toISOString() ?? null;
  const daysSinceLastPost = publishDates[0]
    ? Math.floor(
        (startOfDay(now).getTime() - startOfDay(publishDates[0]).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const expectedPostingDaysThisWeek = typicalDayIndexes.filter((dayIndex) => {
    const offset = dayIndex === 0 ? 6 : dayIndex - 1;
    const targetDay = new Date(weekStart);
    targetDay.setDate(weekStart.getDate() + offset);
    return targetDay <= startOfDay(now);
  }).length;

  return {
    inferred: true,
    typicalPostingDays,
    missedPostingDaysThisWeek,
    postsThisWeek: countPostsInWeek(publishDates, weekStart),
    expectedPostingDaysThisWeek,
    lastPublishedAt,
    daysSinceLastPost,
    lookbackPostCount: publishDates.length,
  };
}
