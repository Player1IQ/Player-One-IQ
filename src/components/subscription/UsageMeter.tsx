import type { UsageSnapshot } from "@/lib/subscription/types";

const metricLabels: Record<string, string> = {
  creators: "Creators",
  team_members: "Team members",
  opportunities: "Opportunities",
  campaigns: "Campaigns",
  ai_requests: "AI requests",
};

interface UsageMeterProps {
  usage: UsageSnapshot[];
}

export function UsageMeter({ usage }: UsageMeterProps) {
  const visible = usage.filter((item) => item.limit !== null);

  if (visible.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Your plan includes unlimited usage for tracked metrics.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {visible.map((item) => {
        const label = metricLabels[item.metricKey] ?? item.metricKey;
        const limit = item.limit;
        const percent =
          limit && limit > 0
            ? Math.min(100, Math.round((item.count / limit) * 100))
            : null;
        const atLimit = limit !== null && item.count >= limit;

        return (
          <div key={item.metricKey}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-gray-300">{label}</span>
              <span className={atLimit ? "text-amber-400" : "text-gray-500"}>
                {item.count}
                {limit !== null ? ` / ${limit}` : " (unlimited)"}
              </span>
            </div>
            {percent !== null ? (
              <div className="h-2 overflow-hidden rounded-full bg-surface">
                <div
                  className={`h-full rounded-full transition-all ${
                    atLimit ? "bg-amber-500" : "bg-accent"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
