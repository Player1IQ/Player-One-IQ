import type { SupabaseClient } from "@supabase/supabase-js";
import { sendTransactionalEmail } from "@/lib/email/send";
import { getConfiguredAppUrl } from "@/lib/email/app-url";
import { isAppLocale, type AppLocale } from "@/i18n/config";
import {
  listCreatorMetricHistory,
  weekOverWeekPercent,
  type MetricHistoryPoint,
} from "@/lib/platform-oauth/metric-history";
import {
  addUtcDays,
  daysBetweenUtcDays,
  isMondayUtc,
  utcDateFromIsoDay,
  utcDateOnly,
  weeklyBriefWindowKey,
} from "./dates";
import {
  getNotificationPreferencesForUser,
  preferenceAllowsKind,
  claimEmailSend,
  releaseEmailSend,
  toRecipient,
} from "./store";
import { buildWeeklyBriefEmail } from "./templates";
import type { NotificationRecipient } from "./types";
import enEmails from "../../../messages/en/emails.json";
import esEmails from "../../../messages/es/emails.json";

const CREATOR_BRIEF_ROLES = ["player", "content_creator"] as const;

export const WEEKLY_BRIEF_LOOKBACK_TARGET_DAYS = 7;
export const WEEKLY_BRIEF_LOOKBACK_MIN_DAYS = 5;
export const WEEKLY_BRIEF_LOOKBACK_MAX_DAYS = 9;

export function isWeeklyBriefEnabled(): boolean {
  const raw = process.env.WEEKLY_BRIEF_ENABLED?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "on" || raw === "yes";
}

export interface WeeklyBriefStats {
  creatorName: string;
  asOfDate: string;
  previousDate: string | null;
  audienceSize: number | null;
  viewTotal: number | null;
  audienceChangePercent: number | null;
  viewsChangePercent: number | null;
  historyPointCount: number;
}

export function pickWeeklyComparisonPoint(
  points: MetricHistoryPoint[],
  sendDate: string,
  currentDate: string
): MetricHistoryPoint | null {
  const send = utcDateFromIsoDay(sendDate);
  const minDate = addUtcDays(send, -WEEKLY_BRIEF_LOOKBACK_MAX_DAYS);
  const maxDate = addUtcDays(send, -WEEKLY_BRIEF_LOOKBACK_MIN_DAYS);
  const targetDate = addUtcDays(send, -WEEKLY_BRIEF_LOOKBACK_TARGET_DAYS);

  const candidates = points.filter(
    (point) =>
      point.capturedOn >= minDate &&
      point.capturedOn <= maxDate &&
      point.capturedOn !== currentDate
  );
  if (candidates.length === 0) return null;

  return [...candidates].sort((left, right) => {
    const leftDelta = Math.abs(daysBetweenUtcDays(left.capturedOn, targetDate));
    const rightDelta = Math.abs(daysBetweenUtcDays(right.capturedOn, targetDate));
    if (leftDelta !== rightDelta) return leftDelta - rightDelta;
    return right.capturedOn.localeCompare(left.capturedOn);
  })[0] ?? null;
}

export function buildWeeklyBriefStats(input: {
  creatorName: string;
  points: MetricHistoryPoint[];
  sendDate?: string;
}): WeeklyBriefStats | null {
  if (input.points.length < 1) return null;

  const sendDate = input.sendDate ?? utcDateOnly();
  const sorted = [...input.points].sort((left, right) =>
    left.capturedOn.localeCompare(right.capturedOn)
  );
  const current =
    [...sorted].reverse().find((point) => point.capturedOn <= sendDate) ??
    sorted[sorted.length - 1];
  if (!current) return null;

  const previous = pickWeeklyComparisonPoint(sorted, sendDate, current.capturedOn);

  return {
    creatorName: input.creatorName,
    asOfDate: current.capturedOn,
    previousDate: previous?.capturedOn ?? null,
    audienceSize: current.audienceSize,
    viewTotal: current.viewTotal,
    audienceChangePercent: previous
      ? weekOverWeekPercent(current.audienceSize, previous.audienceSize)
      : null,
    viewsChangePercent: previous
      ? weekOverWeekPercent(current.viewTotal, previous.viewTotal)
      : null,
    historyPointCount: input.points.length,
  };
}

export function formatBriefCount(
  value: number | null,
  locale: AppLocale
): string {
  if (value == null) return locale === "es" ? "No disponible" : "Not available";
  return new Intl.NumberFormat(locale === "es" ? "es" : "en-US").format(value);
}

export function formatSignedPercent(value: number | null): string | null {
  if (value == null) return null;
  const rounded = Number.isInteger(value) ? String(value) : value.toFixed(1);
  if (value > 0) return `+${rounded}%`;
  return `${rounded}%`;
}

function copyForLocale(locale: AppLocale) {
  return locale === "es" ? esEmails.weeklyBrief : enEmails.weeklyBrief;
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
}

export function buildWeeklyBriefCopy(
  stats: WeeklyBriefStats,
  locale: AppLocale
): { subject: string; heading: string; lines: string[]; actionLabel: string } {
  const copy = copyForLocale(locale);
  const lines = [
    interpolate(copy.intro, {
      creatorName: stats.creatorName,
      asOfDate: stats.asOfDate,
    }),
    `${copy.audience}: ${formatBriefCount(stats.audienceSize, locale)}`,
    `${copy.views}: ${formatBriefCount(stats.viewTotal, locale)}`,
  ];

  const audienceChange = formatSignedPercent(stats.audienceChangePercent);
  const viewsChange = formatSignedPercent(stats.viewsChangePercent);
  if (stats.previousDate && (audienceChange || viewsChange)) {
    lines.push(
      interpolate(copy.comparedRange, {
        fromDate: stats.previousDate,
        toDate: stats.asOfDate,
      })
    );
    const since = interpolate(copy.changeSince, { date: stats.previousDate });
    if (audienceChange) lines.push(`${copy.audience} ${since}: ${audienceChange}`);
    if (viewsChange) lines.push(`${copy.views} ${since}: ${viewsChange}`);
  } else {
    lines.push(copy.noGrowthYet);
  }

  return {
    subject: interpolate(copy.subject, { creatorName: stats.creatorName }),
    heading: copy.heading,
    lines,
    actionLabel: copy.cta,
  };
}

async function loadPreferredLocales(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Map<string, AppLocale>> {
  const locales = new Map<string, AppLocale>();
  if (userIds.length === 0) return locales;

  const { data } = await supabase
    .from("user_profiles")
    .select("user_id, preferred_locale")
    .in("user_id", userIds);

  for (const row of data ?? []) {
    if (row.preferred_locale && isAppLocale(row.preferred_locale)) {
      locales.set(row.user_id, row.preferred_locale);
    }
  }
  return locales;
}

async function sendBriefIfAllowed(
  supabase: SupabaseClient,
  recipient: NotificationRecipient,
  creatorId: string,
  windowKey: string,
  email: { subject: string; text: string; html: string }
): Promise<boolean> {
  const prefs = await getNotificationPreferencesForUser(
    supabase,
    recipient.userId,
    recipient.organizationId
  );
  if (!preferenceAllowsKind(prefs, "weekly_brief")) return false;

  const claimed = await claimEmailSend(
    supabase,
    recipient,
    "weekly_brief",
    creatorId,
    windowKey
  );
  if (!claimed) return false;

  const result = await sendTransactionalEmail({
    to: recipient.email,
    ...email,
  });
  if (!result.sent) {
    await releaseEmailSend(
      supabase,
      recipient,
      "weekly_brief",
      creatorId,
      windowKey
    );
    return false;
  }
  return true;
}

export async function sendWeeklyBriefEmails(
  supabase: SupabaseClient,
  now = new Date()
): Promise<{ sent: number; skipped: number; reason?: string }> {
  if (!isWeeklyBriefEnabled()) {
    return { sent: 0, skipped: 0, reason: "disabled" };
  }

  if (!isMondayUtc(now)) {
    return { sent: 0, skipped: 0, reason: "not_monday" };
  }

  const sendDate = utcDateOnly(now);
  const windowKey = weeklyBriefWindowKey(now);
  const origin = getConfiguredAppUrl();
  const actionUrl = `${origin}/portal/snapshot`;

  const { data: members } = await supabase
    .from("team_members")
    .select(
      "user_id, organization_id, email, role, linked_creator_id, linked_sponsor_id, status"
    )
    .eq("status", "active")
    .in("role", [...CREATOR_BRIEF_ROLES])
    .not("linked_creator_id", "is", null)
    .not("user_id", "is", null);

  const candidates = (members ?? []).flatMap((member) => {
    const recipient = toRecipient(member);
    if (!recipient || !member.linked_creator_id) return [];
    return [{ recipient, creatorId: member.linked_creator_id as string }];
  });

  const locales = await loadPreferredLocales(
    supabase,
    candidates.map((row) => row.recipient.userId)
  );

  const creatorIds = [...new Set(candidates.map((row) => row.creatorId))];
  const { data: creators } = creatorIds.length
    ? await supabase.from("creators").select("id, name").in("id", creatorIds)
    : { data: [] as Array<{ id: string; name: string }> };

  const creatorNames = new Map(
    (creators ?? []).map((row) => [row.id, row.name as string])
  );

  let sent = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    const creatorName = creatorNames.get(candidate.creatorId);
    if (!creatorName) {
      skipped += 1;
      continue;
    }

    const points = await listCreatorMetricHistory(candidate.creatorId, supabase);
    const stats = buildWeeklyBriefStats({
      creatorName,
      points,
      sendDate,
    });
    if (!stats) {
      skipped += 1;
      continue;
    }

    const locale = locales.get(candidate.recipient.userId) ?? "en";
    const copy = buildWeeklyBriefCopy(stats, locale);
    const email = buildWeeklyBriefEmail({
      heading: copy.heading,
      subject: copy.subject,
      lines: copy.lines,
      actionUrl,
      actionLabel: copy.actionLabel,
    });

    const didSend = await sendBriefIfAllowed(
      supabase,
      candidate.recipient,
      candidate.creatorId,
      windowKey,
      email
    );
    if (didSend) sent += 1;
    else skipped += 1;
  }

  return { sent, skipped };
}

export async function sendTestWeeklyBrief(input: {
  supabase: SupabaseClient;
  recipient: NotificationRecipient;
  creatorId: string;
  creatorName: string;
  locale?: AppLocale;
}): Promise<{ sent: true } | { sent: false; error: string }> {
  const points = await listCreatorMetricHistory(input.creatorId, input.supabase);
  const stats = buildWeeklyBriefStats({
    creatorName: input.creatorName,
    points,
    sendDate: utcDateOnly(),
  });
  if (!stats) {
    return {
      sent: false,
      error: "No stored snapshot yet for this linked creator.",
    };
  }

  const locale = input.locale ?? "en";
  const copy = buildWeeklyBriefCopy(stats, locale);
  const origin = getConfiguredAppUrl();
  const email = buildWeeklyBriefEmail({
    heading: copy.heading,
    subject: `[TEST] ${copy.subject}`,
    lines: copy.lines,
    actionUrl: `${origin}/portal/snapshot`,
    actionLabel: copy.actionLabel,
  });

  const result = await sendTransactionalEmail({
    to: input.recipient.email,
    ...email,
  });
  if (!result.sent) {
    return { sent: false, error: result.error };
  }
  return { sent: true };
}
