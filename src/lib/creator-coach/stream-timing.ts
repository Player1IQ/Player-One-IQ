import type { PlatformContentSnapshot } from "@/lib/platform-oauth/content-performance";
import type { ContentItemType } from "@/lib/platform-oauth/content-performance";

const STREAM_CONTENT_TYPES = new Set<ContentItemType>(["stream", "video"]);
export const MIN_ITEMS_FOR_STREAM_TIMES = 8;

export interface StreamTimingPeak {
  weekday: string;
  hourUtc: number;
  count: number;
}

export interface StreamTimingInsight {
  inferred: boolean;
  sampleSize: number;
  peaks: StreamTimingPeak[];
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function parsePublishedAt(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatUtcHour(hour: number): string {
  const display = hour % 12 === 0 ? 12 : hour % 12;
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${display}:00 ${suffix}`;
}

export function formatStreamTimePeaks(peaks: StreamTimingPeak[]): string {
  if (peaks.length === 0) return "";
  const labels = peaks.map(
    (peak) => `${peak.weekday} ${formatUtcHour(peak.hourUtc)} UTC`
  );
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

export function analyzeStreamTiming(
  snapshots: PlatformContentSnapshot[],
  options?: { minItems?: number }
): StreamTimingInsight {
  const minItems = options?.minItems ?? MIN_ITEMS_FOR_STREAM_TIMES;
  const buckets = new Map<string, StreamTimingPeak>();

  for (const snapshot of snapshots) {
    if (!snapshot.connectedViaOAuth) continue;
    for (const item of snapshot.items) {
      if (!STREAM_CONTENT_TYPES.has(item.contentType)) continue;
      const publishedAt = parsePublishedAt(item.publishedAt);
      if (!publishedAt) continue;
      const weekday = WEEKDAYS[publishedAt.getUTCDay()];
      const hourUtc = publishedAt.getUTCHours();
      const key = `${weekday}-${hourUtc}`;
      const existing = buckets.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        buckets.set(key, { weekday, hourUtc, count: 1 });
      }
    }
  }

  const sampleSize = [...buckets.values()].reduce(
    (sum, bucket) => sum + bucket.count,
    0
  );

  if (sampleSize < minItems) {
    return { inferred: false, sampleSize, peaks: [] };
  }

  const peaks = [...buckets.values()]
    .sort((left, right) => right.count - left.count || left.hourUtc - right.hourUtc)
    .slice(0, 3)
    .filter((peak) => peak.count >= 2);

  return {
    inferred: peaks.length > 0,
    sampleSize,
    peaks,
  };
}
