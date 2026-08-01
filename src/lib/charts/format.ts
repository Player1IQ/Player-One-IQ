export function formatChartCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

export function getChartAxisMax(value: number): number {
  if (value <= 0) return 10;
  if (value <= 5) return 5;
  if (value <= 10) return 10;

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;

  if (normalized <= 1) return magnitude;
  if (normalized <= 2) return 2 * magnitude;
  if (normalized <= 5) return 5 * magnitude;
  return 10 * magnitude;
}

export function getChartYAxisTicks(max: number): number[] {
  const ceiling = getChartAxisMax(max);
  if (ceiling <= 10) {
    return Array.from({ length: ceiling + 1 }, (_, index) => index);
  }

  const step =
    ceiling <= 50 ? 10 : ceiling <= 200 ? 50 : ceiling <= 1000 ? 200 : 500;
  const ticks: number[] = [];
  for (let value = 0; value <= ceiling; value += step) {
    ticks.push(value);
  }
  if (ticks[ticks.length - 1] !== ceiling) {
    ticks.push(ceiling);
  }
  return ticks;
}

export const chartTooltipStyle = {
  backgroundColor: "#111520",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
  fontSize: "12px",
  color: "#E5E7EB",
} as const;

export const chartAxisTick = { fill: "#6B7280", fontSize: 12 } as const;

export const chartGridStroke = "rgba(255,255,255,0.04)";

/** Recharts BarChart tooltip cursor — avoids default #ccc hover band on dark UI. */
export const chartBarCursor = { fill: "rgba(124,58,237,0.08)" } as const;

/** Slightly lighter purple hover state for single-fill bars. */
export const chartActiveBar = { fill: "#8B5CF6" } as const;

/** Hover ring for multi-color bars (preserves per-cell fill from `<Cell>`). */
export const chartActiveBarMulti = {
  stroke: "#A78BFA",
  strokeWidth: 1,
} as const;

/** Short label for chart category axes — keeps titles readable without clipping. */
export function chartCategoryLabel(value: string, max = 18): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

/** Word-wrap a title into chart axis lines (no ellipsis — tooltip carries full text). */
export function wrapChartCategoryLabel(
  value: string,
  maxLines = 2,
  maxCharsPerLine = 16
): string[] {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
      current = word;
    } else {
      lines.push(word.slice(0, maxCharsPerLine));
      current = word.slice(maxCharsPerLine);
    }

    if (lines.length >= maxLines) break;
  }

  if (lines.length < maxLines && current) {
    lines.push(current);
  } else if (lines.length >= maxLines && current && lines[maxLines - 1]) {
    const last = lines[maxLines - 1];
    const merged = `${last} ${current}`.trim();
    lines[maxLines - 1] =
      merged.length > maxCharsPerLine
        ? `${merged.slice(0, maxCharsPerLine - 1)}…`
        : merged;
  }

  return lines.slice(0, maxLines);
}

export function getContentTrendBarAxisConfig(itemCount: number): {
  maxCharsPerLine: number;
  maxLines: number;
  bottomMargin: number;
  axisHeight: number;
} {
  if (itemCount <= 1) {
    return { maxCharsPerLine: 24, maxLines: 2, bottomMargin: 8, axisHeight: 0 };
  }
  if (itemCount === 2) {
    return { maxCharsPerLine: 22, maxLines: 2, bottomMargin: 64, axisHeight: 56 };
  }
  if (itemCount === 3) {
    return { maxCharsPerLine: 18, maxLines: 2, bottomMargin: 72, axisHeight: 64 };
  }
  return { maxCharsPerLine: 14, maxLines: 2, bottomMargin: 80, axisHeight: 72 };
}
