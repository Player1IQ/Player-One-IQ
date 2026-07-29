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
